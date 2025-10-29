import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, FlatList, Dimensions, Modal, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../src/config/firebaseConfig';
import { doc, getDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import Toast from 'react-native-toast-message';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import ProductScreen from './ProductScreen';
import PantallaPerfil from './PerfilScreen';
import PantallaProveedor from './ProveedorScreen';
import EmpleadosScreen from './EmpleadosScreen';

// Obtener el ancho de la pantalla para calcular el tamaño de la tarjeta
const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.45; // 45% del ancho de la pantalla
// Definición de la paleta de colores
const COLORS = {
  primaryPurple: '#6A1B9A', // Morado Principal (más vibrante)
  secondaryYellow: '#FFC107', // Amarillo/Dorado Principal
  textDark: '#212121',
  textLight: '#FFFFFF',
  backgroundLight: '#F5F5F5',
  cardBackground: '#FFFFFF', // Blanco para las tarjetas
  shadowColor: '#000000',
  buttonText: '#FFFFFF',
  lowStockRed: '#D32F2F',
  safeStockGreen: '#4CAF50',
};

// Datos para el carrusel, parte de servicios
const DUMMY_SERVICES = [
    { id: 's1', name: 'Baño y Peluquería', icon: 'cut', color: COLORS.primaryPurple, description: 'Cuidado completo para tu mascota.' },
    { id: 's2', name: 'Corte de Uñas', icon: 'cut-outline', color: COLORS.secondaryYellow, description: 'Mantén sus patitas cómodas y sanas.' },
    { id: 's3', name: 'Control de Peso', icon: 'scale', color: COLORS.safeStockGreen, description: 'Seguimiento nutricional y salud.' },
    { id: 's4', name: 'Vacunación', icon: 'medkit-outline', color: '#03A9F4', description: 'Calendario de vacunas al día.' },
];

const CustomConfirmAlert = ({ isVisible, title, message, onConfirm, onCancel }) => {
    const { primaryPurple, secondaryYellow, textLight, textDark, cardBackground } = COLORS; 

    if (!isVisible) return null;

    return (
        <Modal
            animationType="fade" 
            transparent={true}
            visible={isVisible}
            onRequestClose={onCancel}
        >
            <Pressable style={alertStyles.centeredView} onPress={onCancel}>
                <View style={alertStyles.modalView}>
                    <Text style={alertStyles.modalTitle}>{title}</Text>
                    <Text style={alertStyles.modalMessage}>{message}</Text>

                    <View style={alertStyles.buttonContainer}>
                        {/* Botón de Cancelar (Dorado/Amarillo) */}
                        <TouchableOpacity 
                            style={[alertStyles.button, { backgroundColor: secondaryYellow }]}
                            onPress={onCancel}
                            activeOpacity={0.8}
                        >
                            <Text style={[alertStyles.textStyle, { color: textDark }]}>
                                CANCELAR
                            </Text>
                        </TouchableOpacity>

                        {/* Botón de Confirmar (Morado) */}
                        <TouchableOpacity
                            style={[alertStyles.button, { backgroundColor: primaryPurple }]}
                            onPress={onConfirm}
                            activeOpacity={0.8}
                        >
                            <Text style={[alertStyles.textStyle, { color: textLight }]}>
                                SALIR
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Pressable>
        </Modal>
    );
};

//Carrusel
// Tarjeta para mostrar Servicios
const ServiceCard = ({ service }) => (
    <View style={[styles.serviceCard, { backgroundColor: service.color, borderColor: COLORS.cardBackground }]}>
        <Ionicons name={service.icon} size={35} color={COLORS.textLight} />
        <Text style={styles.serviceName}>{service.name}</Text>
        <Text style={styles.serviceDescription}>{service.description}</Text>
    </View>
);

// Tarjeta para mostrar Productos con Stock Bajo
const LowStockCard = ({ product, onPress }) => (
    <TouchableOpacity 
        style={styles.lowStockCard} 
        onPress={onPress}
    >
        <Ionicons name="alert-circle" size={30} color={COLORS.lowStockRed} />
        <Text style={styles.lowStockName}>{product.name}</Text>
        <View style={styles.stockInfo}>
            <Text style={styles.stockLabel}>Stock:</Text>
            <Text style={styles.stockValue}>{product.stock}</Text>
        </View>
        <View style={styles.stockInfo}>
            <Text style={styles.stockLabel}>Mínimo:</Text>
            <Text style={styles.minValue}>{product.minStock}</Text>
        </View>
    </TouchableOpacity>
);

function Home({ navigation, tabNavigation }) {
  const [userName, setUserName] = useState('');
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [isLogOutAlertVisible, setIsLogOutAlertVisible] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userName = user.displayName || user.email.split('@')[0];
        setUserName(userName);
        
        // Solo hacer la consulta de productos si el usuario está autenticado
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const unsubscribeProducts = onSnapshot(
            q,
            (querySnapshot) => {
                const lowStockItems = [];
                querySnapshot.forEach((d) => {
                    const data = d.data();
                    
                    // ✅ Lógica: Si 'stock' es menor o igual a un 'stockMinimo' definido (fijo en 5 o tomado de minStock)
                    const currentStock = data.stock ?? 0;
                    const minThreshold = data.minStock ? parseInt(data.minStock) : 5; // Usamos 5 si no está definido

                    if (currentStock <= minThreshold) {
                        lowStockItems.push({
                            id: d.id,
                            name: data.name || 'Producto Desconocido',
                            stock: currentStock,
                            minStock: minThreshold,
                        });
                    }
                });
                setLowStockProducts(lowStockItems);
            },
            (error) => {
                console.error('Error fetching low stock products:', error);
                // Limpiar productos si hay error
                setLowStockProducts([]);
            }
        );
        
        // Retornar función de limpieza para productos
        return unsubscribeProducts;
      } else {
        // Si no hay usuario, limpiar datos
        setUserName('');
        setLowStockProducts([]);
      }
    });

    // Función de limpieza principal
    return () => {
      unsubscribeAuth();
    };
  }, []);

  /* Función para manejar el cierre de sesión con confirmación */
  // LÓGICA DE MODALES:

  // Maneja la acción final de cerrar sesión
  const handleConfirmLogOut = async () => {
    setIsLogOutAlertVisible(false); 
    try {
        await signOut(auth);
        Toast.show({ type: 'success', text1: 'Sesión cerrada', text2: '¡Vuelve Pronto! 🐶🐾', visibilityTime: 2000 });
        setTimeout(() => { navigation.replace('Login'); }, 1500);
    } catch (error) {
        Toast.show({ type: 'error', text1: 'Ups...', text2: 'No pudimos cerrar la sesión. Intentá nuevamente.', visibilityTime: 2500 });
    }
  };
  // Maneja la cancelación de cerrar sesión
  const handleCancelLogOut = () => {
      setIsLogOutAlertVisible(false);
      Toast.show({ type: 'info', text1: 'Sesión mantenida 🐾', text2: '¡Nos quedamos un rato más!', visibilityTime: 2000 });
  };
  const handleLogOut = () => {
    setIsLogOutAlertVisible(true);
  };
  const handleShowStockAlert = (productName) => {
      Alert.alert(
          '¡Aviso de Reabastecimiento!', 
          `El producto "${productName}" necesita ser reabastecido. Por favor, revisa el pedido.`,
          [{ text: 'OK' }] // Botón para cerrar el alert nativo
      );
  };

  /* Componente para los botones de navegación (Dashboard/Menú) */
  const BotonNavegacion = ({ icon, texto, destino }) => (
    <View style={styles.BotonContainer}>
      <TouchableOpacity
        style={styles.boton}
        onPress={() => navigation.navigate(destino)}
        activeOpacity={0.8}
      >
        <View style={styles.iconWrapper}>
          <AntDesign name={icon} size={30} color={COLORS.primaryPurple} />
        </View>
        <Text style={styles.botonTexto}>{texto}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.logoAndTitleContainer}>
              <Image source={require('../assets/logo.png')} style={styles.logo} />
              <Text style={styles.roleText}>Alma Canina</Text>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogOut}>
              <Text style={styles.logoutText}>Cerrar sesión</Text>
              <MaterialIcons name="logout" size={18} color={COLORS.textLight} style={{ marginLeft: 5 }} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            <View style={styles.content}>
              <View style={styles.welcomeCard}>
                <FontAwesome6 name="paw" size={40} color={COLORS.primaryPurple} style={styles.pawIcon} />
                <View style={styles.welcomeTextContainer}>
                  <Text style={styles.welcomeTitle}>¡Bienvenido de vuelta!</Text>
                  <Text style={styles.userName}>{userName}</Text>
                  <Text style={styles.questionText}>¿Qué deseas administrar hoy?</Text>
                </View>
              </View>

              <View style={styles.menuGrid}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    const parentNav = navigation.getParent ? navigation.getParent() : navigation;
                    parentNav.navigate('GestionarProductos');
                  }}>
                  <BotonNavegacion icon="inbox" texto="Productos" destino="GestionarProductos" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    const parentNav = navigation.getParent ? navigation.getParent() : navigation;
                    parentNav.navigate('Empleados');
                  }}>
                  <BotonNavegacion icon="team" texto="Empleados" destino="Empleados" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    const parentNav = navigation.getParent ? navigation.getParent() : navigation;
                    parentNav.navigate('Proveedores');
                  }}>
                  <BotonNavegacion icon="car" texto="Proveedores" destino="Proveedores" />
                </TouchableOpacity>
              </View>

              <View style={styles.carouselContainer}>
                  <Text style={styles.sectionTitle}>Servicios Destacados 🐾</Text>
                  <FlatList
                      data={DUMMY_SERVICES}
                      keyExtractor={(item) => item.id}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      snapToAlignment="start"
                      decelerationRate="fast"
                      contentContainerStyle={{ paddingHorizontal: 5 }}
                      renderItem={({ item }) => <ServiceCard service={item} />}
                  />
              </View>

              <View style={styles.carouselContainer}>
                  <Text style={styles.sectionTitle}>⚠️ Stock Bajo ({lowStockProducts.length})</Text>
                  
                  {lowStockProducts.length > 0 ? (
                      <FlatList
                          data={lowStockProducts}
                          keyExtractor={(item) => item.id}
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          snapToAlignment="start"
                          decelerationRate="fast"
                          contentContainerStyle={{ paddingHorizontal: 5 }}
                          renderItem={({ item }) => (
                              <LowStockCard 
                                  product={item} 
                                  // ✅ CORRECCIÓN: Conecta la tarjeta con la función Alert.alert
                                  onPress={() => handleShowStockAlert(item.name)} 
                              />
                          )}
                      />
                  ) : (
                      <View style={styles.safeStockMessage}>
                          <Ionicons name="checkmark-circle-outline" size={24} color={COLORS.safeStockGreen} />
                          <Text style={styles.safeStockText}>¡Todo el stock está en niveles seguros!</Text>
                      </View>
                  )}
              </View>
            </View>
          </ScrollView>
        </View>
        <CustomConfirmAlert
            isVisible={isLogOutAlertVisible}
            title="¿Salir de tu Cuenta?"
            message="Tu sesión actual se cerrará y podrás volver cuando lo desees."
            onConfirm={handleConfirmLogOut}
            onCancel={handleCancelLogOut}
        />
      </SafeAreaView>
      <Toast />
    </>
  );
}

// Componentes para las pantallas de cada tab (No se modifica la lógica)
function InicioScreen({ navigation }) {
  const tabNavigation = useNavigation();

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.backgroundLight }}>
      <Home navigation={navigation} tabNavigation={tabNavigation} />
    </View>
  );
}

function PerfilScreen({ navigation }) {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.backgroundLight }}>
      <PantallaPerfil navigation={navigation} />
    </View>
  );
}

// Configuración del Tab Navigator (Se aplica el nuevo color)
const Tab = createBottomTabNavigator();

export default function HomeWithTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.secondaryYellow, // Fondo blanco para un look limpio
          height: 70, // Un poco más bajo
          paddingBottom: 5,
          paddingTop: 5,
          borderTopWidth: 2,
          borderTopColor: COLORS.cardBackground, // Línea superior dorada
          elevation: 5,
        },
        tabBarActiveTintColor: COLORS.primaryPurple, // Icono activo morado
        tabBarInactiveTintColor: '#6d6969ff', // Icono inactivo gris claro
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700', // Más negrita
        },
      }}
    >
      <Tab.Screen
        name="INICIO"
        component={InicioScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={26} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="PERFIL"
        component={PerfilScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <FontAwesome name="user" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const alertStyles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)', 
    },
    modalView: {
        width: '85%',
        margin: 20,
        backgroundColor: COLORS.cardBackground,
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        shadowColor: COLORS.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 8,
        borderTopWidth: 5,
        borderTopColor: COLORS.primaryPurple, // Acento Morado por defecto
    },
    modalTitle: {
        marginBottom: 15,
        textAlign: 'center',
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.primaryPurple,
    },
    modalMessage: {
        marginBottom: 25,
        textAlign: 'center',
        fontSize: 16,
        color: COLORS.textDark,
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    button: {
        borderRadius: 12,
        padding: 12,
        elevation: 2,
        width: '48%',
    },
    singleButton: {
        borderRadius: 12,
        padding: 12,
        elevation: 2,
        width: '100%',
    },
    textStyle: {
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  // --- SCROLL CONTAINER ---
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20, // Espacio adicional al final para mejor scroll
  },
  // --- HEADER ---
  header: {
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 4,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  logoAndTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 35,
    height: 35,
    resizeMode: 'contain',
    marginRight: 8,
  },
  roleText: {
    fontSize: 20,
    fontWeight: '800', // Muy negrita
    color: COLORS.primaryPurple,
  },
  logoutButton: {
    backgroundColor: COLORS.primaryPurple, // Botón dorado
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 25, // Más redondeado
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  logoutText: {
    color: COLORS.textLight, // Texto oscuro en botón dorado para contraste
    fontSize: 14,
    fontWeight: '700',
  },

  content: {
    flex: 1,
    padding: 20,
  },

  // --- TARJETA DE BIENVENIDA MEJORADA ---
  welcomeCard: {
    backgroundColor: COLORS.secondaryYellow,
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    // Sombra más notoria para 'flotar'
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 2,
    borderColor: COLORS.primaryPurple, // Borde morado sutil
  },
  pawIcon: {
      marginRight: 15,
      // Se podría añadir un fondo circular blanco a la pata
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textDark,
  },
  userName: {
    fontSize: 24,
    fontWeight: '900', // Muy negrita para el nombre
    color: COLORS.primaryPurple,
    marginBottom: 4,
  },
  questionText: {
    fontSize: 14,
    color: COLORS.textDark,
  },

  // --- BOTONES DE MENÚ MEJORADOS (GRID) ---
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  menuItem: {
    width: '100%', // Para que los botones se vean como lista vertical completa
    marginBottom: 15,
  },
  BotonContainer: {
    alignItems: 'center',
    width: '100%',
  },
  boton: {
    backgroundColor: COLORS.cardBackground, // Blanco
    paddingVertical: 20, // Más relleno vertical
    paddingHorizontal: 20,
    borderRadius: 15,
    flexDirection: 'row', // Icono a la izquierda
    alignItems: 'center',
    justifyContent: 'flex-start', // Alinear a la izquierda
    width: '100%',
    minHeight: 80,
    shadowColor: COLORS.shadowColor,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 4,
    borderLeftWidth: 5, // Línea de acento morada a la izquierda
    borderLeftColor: COLORS.primaryPurple,
  },
  iconWrapper: {
    marginRight: 15, // Espacio entre icono y texto
  },
  botonTexto: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  // --- ESTILOS DE CARRUSEL ---
    carouselContainer: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textDark,
        marginBottom: 10,
        paddingHorizontal: 5,
    },
    
    // --- SERVICE CARD STYLES ---
    serviceCard: {
        width: ITEM_WIDTH,
        height: 120,
        borderRadius: 15,
        padding: 15,
        marginRight: 15,
        justifyContent: 'space-between',
        shadowColor: COLORS.shadowColor,
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 3,
        elevation: 4,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textLight,
    },
    serviceDescription: {
        fontSize: 11,
        color: COLORS.textLight,
        opacity: 0.8,
    },

    // --- LOW STOCK CARD STYLES ---
    lowStockCard: {
        width: ITEM_WIDTH,
        height: 120,
        backgroundColor: COLORS.cardBackground,
        borderRadius: 15,
        padding: 15,
        marginRight: 15,
        borderWidth: 2,
        borderColor: COLORS.lowStockRed, // Borde rojo de alerta
        justifyContent: 'space-between',
        shadowColor: COLORS.shadowColor,
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 5,
        elevation: 6,
    },
    lowStockName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textDark,
        marginTop: 5,
    },
    stockInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 2,
    },
    stockLabel: {
        fontSize: 12,
        color: COLORS.textDark,
        fontWeight: '500',
    },
    stockValue: {
        fontSize: 14,
        fontWeight: '900',
        color: COLORS.lowStockRed,
    },
    minValue: {
        fontSize: 12,
        fontWeight: '900',
        color: COLORS.textDark,
    },
    safeStockMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.cardBackground,
        padding: 15,
        borderRadius: 10,
        borderLeftWidth: 5,
        borderLeftColor: COLORS.safeStockGreen,
        marginHorizontal: 5,
    },
    safeStockText: {
        marginLeft: 10,
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.safeStockGreen,
    },
});