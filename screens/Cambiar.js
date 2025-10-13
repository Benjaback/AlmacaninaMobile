import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../src/config/firebaseConfig';
import Toast from 'react-native-toast-message';

export default function Cambiar({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  
  const handleEmailReset = async () => {
    setEmailError(''); // Limpiar errores previos
    
    if (!email) {
      setEmailError('Por favor ingresa tu email.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      Toast.show({
        type: 'success',
        text1: 'Email enviado',
        text2: 'Revisa tu correo para restablecer la contraseña'
      });
      // Navegar de vuelta al login después de un tiempo
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (error) {
      switch (error.code) {
        case 'auth/user-not-found':
          setEmailError('No existe una cuenta con este email');
          break;
        case 'auth/invalid-email':
          setEmailError('El formato del email no es válido');
          break;
        case 'auth/too-many-requests':
          Toast.show({
            type: 'error',
            text1: 'Demasiados intentos',
            text2: 'Espera un momento antes de intentar nuevamente.'
          });
          break;
        case 'auth/network-request-failed':
          Toast.show({
            type: 'error',
            text1: 'Error de conexión',
            text2: 'Por favor intenta más tarde.'
          });
          break;
        default:
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Error al enviar email'
          });
      }
    }
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Recuperar Contraseña</Text>
      
      <Text style={{ marginBottom: 10, fontSize: 16 }}>
        Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
      </Text>
      
      <Text style={{ marginBottom: 10 }}>Email:</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Ingresa tu email"
        keyboardType="email-address"
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 5 }}
      />
      {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
      
      <TouchableOpacity 
        onPress={handleEmailReset}
        disabled={loading}
        style={{ 
          backgroundColor: loading ? '#ccc' : '#007bff', 
          padding: 15, 
          alignItems: 'center',
          marginBottom: 20
        }}
      >
        <Text style={{ color: '#fff' }}>
          {loading ? 'Enviando...' : 'Enviar Email de Recuperación'}
        </Text>
      </TouchableOpacity>

      {/* Botón para volver */}
      <TouchableOpacity 
        onPress={() => navigation.goBack()}
        style={{ 
          backgroundColor: '#6c757d', 
          padding: 15, 
          alignItems: 'center',
          marginTop: 20
        }}
      >
        <Text style={{ color: '#fff' }}>Volver al Login</Text>
      </TouchableOpacity>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: '#B50000',
    fontSize: 12,
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
});