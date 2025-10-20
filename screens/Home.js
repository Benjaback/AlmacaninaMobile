import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../src/config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import Toast from 'react-native-toast-message';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import ProductScreen from './ProductScreen';
import PantallaPerfil from './PerfilScreen';
import PantallaProveedor from './ProveedorScreen';
import EmpleadosScreen from './EmpleadosScreen';


function Home({ navigation, tabNavigation }) {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
  
        const userName = user.displayName || user.email.split('@')[0];
        setUserName(userName);
      }
    });
    return unsubscribe;
  }, []);
  /* Función para manejar el cierre de sesión con confirmación */
  const handleLogOut = async () => {
  Alert.alert(
    '¿Salir de tu Cuenta?',
    'Tu sesión actual se cerrará y podrás volver cuando lo desees.',
    [
      {
        text: 'Cancelar',
        style: 'destructive',
        onPress: () => {
          Toast.show({
            type: 'info',
            text1: 'Tu sesión sigue activa 🐾',
            text2:'¡Nos quedamos un rato más!',
            visibilityTime: 2000,
          });
        }
      },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
            Toast.show({
              type: 'success',
              text1: 'Sesión cerrada',
              text2: '¡Vuelve Pronto! 🐶🐾',
              visibilityTime: 2000,
            });

            setTimeout(() => {
              navigation.replace('Login');
            }, 1500);
          } catch (error) {
            Toast.show({
              type: 'error',
              text1: 'Ups...',
              text2: 'No pudimos cerrar la sesión. Intentá nuevamente.',
              visibilityTime: 2500,
            });
          }
        }
      }
    ],
    {
      cancelable: true,
      onDismiss: () => {
        Toast.show({
          type: 'info',
          text1: 'Sesión mantenida',
          text2: 'Continuás navegando en AlmaCanina 🐾',
          visibilityTime: 2000,
        });
      }
    }
  );
};


  /* Componente para los botones de navegación */
  const BotonNavegacion = ({ icon, texto, destino, tabNavigation }) => (
    <View style={styles.BotonContainer}>
      <TouchableOpacity
        style={styles.boton}
        onPress={() => navigation.navigate(destino)}
        activeOpacity={0.8}
      >
        <View style={styles.iconWrapper}>
          <AntDesign name={icon} size={28} color="#4B0082" />
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
            <View style={styles.userInfo}>
              <FontAwesome6 name="circle-user" size={35} color="#333" />
              <Text style={styles.userName}>{userName}</Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogOut}>
              <Text style={styles.logoutText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>

            <View style={styles.welcomeCard}>
              <View style={styles.iconContainer}>
                <Image source={require('../assets/logo.png')} style={styles.logo} />
              </View>
              <View style={styles.welcomeTextContainer}>
                <Text style={styles.welcomeTitle}>Bienvenido</Text>
                <Text style={styles.roleText}>Administrador</Text>
                <Text style={styles.questionText}>¿Qué deseas administrar hoy?</Text>
              </View>
            </View>

            <View>
              <View>
                <TouchableOpacity onPress={() => {
                  // Navegar a la pantalla de productos directamente
                  try {
                    const parentNav = navigation && navigation.getParent ? navigation.getParent() : null;
                    if (parentNav && parentNav.navigate) {
                      parentNav.navigate('GestionarProductos');
                    } else if (navigation && navigation.navigate) {
                      navigation.navigate('GestionarProductos');
                    }
                  } catch (e) {
                    navigation && navigation.navigate && navigation.navigate('GestionarProductos');
                  }
                }}>
                  <View style={styles.menuContainer}>
                    <BotonNavegacion icon="inbox" texto="Productos" destino="GestionarProductos" navigation={navigation} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
            <View>
              <View>
                <TouchableOpacity onPress={() => {
                  // Los saque del tab porque sino saltaba error y debia ponerlo en el tab, cosa que no va ahi
                  try {
                    const parentNav = navigation && navigation.getParent ? navigation.getParent() : null;
                    if (parentNav && parentNav.navigate) {
                      parentNav.navigate('Empleados');
                    } else if (navigation && navigation.navigate) {
                      navigation.navigate('Empleados');
                    }
                  } catch (e) {
                    navigation && navigation.navigate && navigation.navigate('Empleados');
                  }
                }}>
                  <View style={styles.menuContainer}>
                    <BotonNavegacion icon="team" texto="Empleados" destino="Empleados" navigation={navigation} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
            <View>
              <View>
                <TouchableOpacity onPress={() => {
                  // Los saque del tab porque sino saltaba error y debia ponerlo en el tab, cosa que no va ahi
                  try {
                    const parentNav = navigation && navigation.getParent ? navigation.getParent() : null;
                    if (parentNav && parentNav.navigate) {
                      parentNav.navigate('Proveedores');
                    } else if (navigation && navigation.navigate) {
                      navigation.navigate('Proveedores');
                    }
                  } catch (e) {
                    navigation && navigation.navigate && navigation.navigate('Proveedores');
                  }
                }}>
                  <View style={styles.menuContainer}>
                    <BotonNavegacion icon="user" texto="Proveedores" destino="Proveedores" navigation={navigation} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
      <Toast />
    </>
  );
}

// Componentes para las pantallas de cada tab
function InicioScreen({ navigation }) {
  const tabNavigation = useNavigation();
  
  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <Home navigation={navigation} tabNavigation={tabNavigation} />
    </View>
  );
}


function PerfilScreen({ navigation }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <PantallaPerfil navigation={navigation} />
    </View>
  );
}



// Configuración del Tab Navigator
const Tab = createBottomTabNavigator();

export default function HomeWithTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFD700', // Color dorado
          height: 80,
          paddingBottom: 12,
          paddingTop: 12,
        },
        tabBarActiveTintColor: '#333',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="INICIO"
        component={InicioScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
// Estilos para el header
  header: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderRadius: 30,
    borderTopWidth: 2,
    borderTopColor: '#8F08AA',
    borderRightWidth: 2,
    borderRightColor: '#8F08AA',
    borderBottomWidth: 2,
    borderBottomColor: '#8F08AA',
    borderLeftWidth: 2,
    borderLeftColor: '#8F08AA',
    borderStyle: 'solid',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 19,
    fontWeight: '700',
    color: '#333',
    marginLeft: 10,
  },
  logoutButton: {
    backgroundColor: '#8F08AA',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  content: {
    flex: 1,
    padding: 20,
  },

  // Estilos para la tarjeta de bienvenida
  welcomeCard: {
    backgroundColor: '#FFD700',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    elevation: 3,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderTopWidth: 2,
    borderTopColor: '#8F08AA',
    borderRightWidth: 2,
    borderRightColor: '#8F08AA',
    borderBottomWidth: 2,
    borderBottomColor: '#8F08AA',
    borderLeftWidth: 2,
    borderLeftColor: '#8F08AA',
    borderStyle: 'solid',
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  questionText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
    roleText:{
    fontSize: 18,
    color: '#3f3f3fff',
  },
  logo: {
    width: 90,
    height: 80,
    resizeMode: 'contain',
  },

  // Estilos para las pantallas de los cards
  screenContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  screenSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  menuContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  marginTop: 20,
  },
  BotonContainer: {
    alignItems: 'center',
  },
  boton: {
    backgroundColor: '#EDE7F6',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: 360,
    height: 100,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  iconWrapper: {
    marginBottom: 5,
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B0082',
  },
});