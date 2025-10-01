import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, SafeAreaView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../src/config/firebaseConfig';
import Toast from 'react-native-toast-message';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

export default function PantallaInicio({ navigation }) {
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

  const cerrarSesion = async () => {
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
    <SafeAreaView style={styles.pantalla}>
      <View style={styles.encabezado}>
        <View style={styles.infoUsuario}>
          <FontAwesome6 name="circle-user" size={35} color="#333" />
          <Text style={styles.nombreUsuario}>{userName || 'Usuario'}</Text>
        </View>
        <TouchableOpacity style={styles.botonCerrarSesion} onPress={cerrarSesion}>
          <Text style={styles.textoCerrarSesion}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contenido}>
        <View style={styles.tarjetaBienvenida}>
          <View style={styles.contenedorIcono}>
            <Image source={require('../assets/logoAM.png')} style={styles.logo} />
          </View>
          <View style={styles.contenedorTexto}>
            <Text style={styles.titulo}>Bienvenido</Text>
            <Text style={styles.textoRol}>Administrador</Text>
            <Text style={styles.pregunta}>¿Qué deseas administrar hoy?</Text>
          </View>
        </View>

        <View style={styles.contenedorBotones}>
          <TouchableOpacity 
            style={[styles.boton, styles.botonProductos]} 
            onPress={() => navigation.navigate('GestionarProductos')}
          >
            <View style={styles.envoltorIcono}>
              <AntDesign name="inbox" size={24} color="white" />
            </View>
            <Text style={styles.textoBoton}>EDITAR PRODUCTOS</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  infoUsuario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nombreUsuario: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  botonCerrarSesion: {
    backgroundColor: '#f44336',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  textoCerrarSesion: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  contenido: {
    flex: 1,
    padding: 20,
  },
  tarjetaBienvenida: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contenedorIcono: {
    alignItems: 'center',
    marginBottom: 15,
  },
  logo: {
    width: 80,
    height: 80,
  },
  contenedorTexto: {
    alignItems: 'center',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  textoRol: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  pregunta: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  contenedorBotones: {
    flex: 1,
  },
  boton: {
    backgroundColor: '#9c27b0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    gap: 10,
  },
  botonProductos: {
    backgroundColor: '#9c27b0',
  },
  envoltorIcono: {
    marginRight: 5,
  },
  textoBoton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});