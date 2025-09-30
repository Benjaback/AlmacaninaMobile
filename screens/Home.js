import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../src/config/firebaseConfig';

export default function PantallaInicio({ navigation }) {

  const cerrarSesion = async () => {
    try {
      await signOut(auth);  
      Alert.alert("Sesión cerrada", "Has cerrado sesión correctamente.");
      navigation.replace('Login');  
    } catch (error) {
      Alert.alert("Error", "Hubo un problema al cerrar sesión.");
    }
  };

  return (
    <View style={styles.pantalla}>
      <Image source={require('../assets/logoAM.png')} style={styles.logo} />
      <Text style={styles.titulo}>Bienvenido a la aplicación</Text>
      
      <TouchableOpacity 
        style={[styles.boton, styles.botonProductos]} 
        onPress={() => navigation.navigate('GestionarProductos')}
      >
        <Text style={styles.textoBoton}>EDITAR PRODUCTOS</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.boton} onPress={cerrarSesion}>
        <Text style={styles.textoBoton}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  boton: {
    backgroundColor: '#922b21',
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 5,
    marginTop: 20,
  },
  botonProductos: {
    backgroundColor: '#9c27b0',
  },
  textoBoton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

