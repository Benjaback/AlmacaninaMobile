import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ImageBackground } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../src/config/firebaseConfig';
import Toast from 'react-native-toast-message';
import AntDesign from '@expo/vector-icons/AntDesign';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Por favor ingrese ambos campos.'
      });
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setPasswordError('');
      setEmailError('');
      Toast.show({
        type: 'success',
        text1: 'Login exitoso',
        text2: 'Has iniciado sesión correctamente.',
        props: {
          style: { backgroundColor: '#8F08AA' }
        }
      });
      
      setTimeout(() => {
        navigation.reset({ index: 0, routes: [{ name: 'Inicio' }] });
      }, 500);
    } catch (error) {

      setPasswordError('');
      setEmailError('');
      
      switch (error.code) {
        case 'auth/invalid-email':
          setEmailError("El formato del correo electrónico no es válido.");
          break;
        case 'auth/wrong-password':
          setPasswordError("Contraseña incorrecta");
          break;
        case 'auth/user-not-found':
          setEmailError("No se encontró un usuario con este correo.");
          break;
        case 'auth/invalid-credential':
          setPasswordError("Email o contraseña incorrectos.");
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
            text1: 'Error de autenticación.',
            text2: `Código: ${error.code}`
          });
      }
    }
  };

  return (
    <>
      <ImageBackground
        source={require('../assets/fondoAM.jpg')}
        style={styles.container}
        resizeMode="cover"
      >
      <KeyboardAwareScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraHeight={120}
        extraScrollHeight={120}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.overlay}>
          <Image source={require('../assets/logo.png')} style={styles.logo} />
          <Text style={styles.title}>Iniciar sesión</Text>

          <View style={styles.socialIcon}>
            <TouchableOpacity>
              <AntDesign name="google" style={styles.iconSocial} size={30} color="black" />
            </TouchableOpacity>
            <TouchableOpacity>
              <FontAwesome name="facebook-square" style={styles.iconSocial} size={30} color="black" />
            </TouchableOpacity>
            <TouchableOpacity>
              <AntDesign name="apple" style={styles.iconSocial} size={30} color="black" />
            </TouchableOpacity>
          </View>

        <Text style={styles.label}>Correo</Text>
        <View style={styles.inputContainer}>
          <FontAwesome name="envelope" size={20} color="#ccc" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Ingrese su correo"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

        <Text style={styles.label}>Contraseña</Text>
        <View style={styles.inputContainer}>
          <FontAwesome name="lock" size={20} color="#ccc" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Ingrese su contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <FontAwesome name={showPassword ? "eye-slash" : "eye"} size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

        
        <TouchableOpacity style={styles.contCambiarText} onPress={() => navigation.navigate('Cambiar')}>
          <Text style={styles.cambiarText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Ingresar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.signUpText}>
            ¿No estas registrado aún?
            <Text style={styles.signUp}> Regístrate.</Text>
          </Text>
        </TouchableOpacity>
        <View style={{ height: 20 }} />
        </View>
      </KeyboardAwareScrollView>
    </ImageBackground>
    <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlay: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingVertical: '20%', /* Altura del contenedor de login */
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#8F08AA',
    marginBottom: 20,
    width: '100%',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 40,
  },
  button: {
    backgroundColor: '#8F08AA',
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 5,
    marginTop: 20,
    borderRadius: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signUpText: {
    top: 25,
    color: '#007AFF',
  },
  signUp:{ /* texto registrarse del singUpText */
    textDecorationLine: 'underline',
  },
  contCambiarText:{ /* Contenedor de pregunta de olvidar contraseña*/
    alignSelf: 'flex-end',
  },
  cambiarText: { /* Pregunta de olvidar contraseña */
    marginTop: 5,
    color: '#007AFF',
    textAlign: 'center',
  },
  socialIcon:{ /* Contenedor de iconos de redes sociales */
    flexDirection: 'row',
  },
  iconSocial:{ /* Iconos de redes sociales */
    marginHorizontal: 15,
  },
  errorText: {
    color: '#B50000',
    fontSize: 12,
    marginTop: -15,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
});
