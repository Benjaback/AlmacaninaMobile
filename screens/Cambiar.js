import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Linking } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../src/config/firebaseConfig';
import Toast from 'react-native-toast-message';
import { Image, ImageBackground } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

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
      setTimeout(() => {
        navigation.goBack();
      }, 3500);
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
    <ImageBackground
      source={require('../assets/fondoAM.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <KeyboardAwareScrollView 
        style={{flex: 1, width: '100%'}} 
        contentContainerStyle={{flexGrow: 1, justifyContent: 'center', alignItems: 'center'}} 
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraHeight={120}
        extraScrollHeight={120}
        showsVerticalScrollIndicator={false}
        resetScrollToCoords={{ x: 0, y: 0 }}
      >
        <View style={styles.overlay}>
          <Image source={require('../assets/logoAM.png')} style={styles.logo} />
          <Text style={styles.title}>Recuperar Contraseña</Text>
          <Text style={styles.label}>Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.</Text>
          <View style={styles.inputContainer}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Ingresa tu email"
              keyboardType="email-address"
              style={styles.input}
            />
          </View>
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          <TouchableOpacity 
            onPress={handleEmailReset}
            disabled={loading}
            style={[styles.button, loading && { backgroundColor: '#ccc' }]}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Enviando...' : 'Enviar Email '}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleEmailReset}
            disabled={loading}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Volver a mandar Email</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={{ alignSelf: 'center', marginTop: 8 }}
          >
            <Text style={{ color: '#007bff', fontSize: 13, textDecorationLine: 'underline', textAlign: 'center' }}>Volver al Login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
      <Toast />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: '#B50000',
    fontSize: 12,
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    width: '90%',
    maxWidth: 350,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  logo: {
    width: 70,
    height: 70,
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#8F08AA',
    textAlign: 'center',
  },
  label: {
    fontSize: 15,
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#8F08AA',
    marginBottom: 15,
    width: '100%',
    backgroundColor: 'transparent',
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 15,
    paddingHorizontal: 10,
    backgroundColor: 'transparent',
  },
  button: {
    backgroundColor: '#8F08AA',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginTop: 10,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginTop: 5,
    width: '100%',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});