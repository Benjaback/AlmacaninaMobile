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

  const handleLogOut = async () => {
    
    try {
      await signOut(auth);  
      Toast.show({
        type: 'success',
        text1: 'Sesión cerrada',
        text2: 'Has cerrado sesión correctamente.',
        props: {
          style: {
            borderLeftColor: '8F08AA',
           }
        }
      });
      
      setTimeout(() => {
        navigation.replace('Login');
      }, 1500);
      
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Hubo un problema al cerrar sesión.'
      });
    }
  };

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

            <View style={styles.BotonContainer}>
              <View>
                <TouchableOpacity style={styles.boton} onPress={() => {
                  // Navegar a la pestaña PRODUCTOS del TabNavigator
                  if (tabNavigation) {
                    tabNavigation.navigate('PRODUCTOS');
                  }
                }}>
                  <View style={styles.iconWrapper}>
                    <AntDesign name="inbox" size={24} color="black" />
                  </View>
                  <Text style={styles.botonTexto}>Productos</Text>
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

function ProductosScreen({ navigation }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <ProductScreen navigation={navigation} />
    </View>
  );
}

function NotificacionesScreen() {
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.screenTitle}>Notificaciones</Text>
      <Text style={styles.screenSubtitle}>Mantente al día con las últimas notificaciones</Text>
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
        name="PRODUCTOS"
        component={ProductosScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <AntDesign name="inbox" size={24} color={color} />
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
  

  header: {
    backgroundColor: '#fff',
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
    borderTopColor: '#000000ff',
    borderRightWidth: 2,
    borderRightColor: '#000000ff',
    borderBottomWidth: 2,
    borderBottomColor: '#000000ff',
    borderLeftWidth: 2,
    borderLeftColor: '#000000ff',
    borderStyle: 'solid',
    
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
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


  welcomeCard: {
    backgroundColor: '#ffd900bb',
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

  BotonContainer: {
    backgroundColor: '#E5D3F2',
    height: '10%',
    width: '50%',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  boton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    borderRadius: 30,
    marginBottom: 8,
  },
  botonTexto:{
    fontSize: 18,
    color: '#000000ff',
  },
  // Estilos para las pantallas de los tabs
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
});