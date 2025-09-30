import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ImageBackground } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { auth } from '../src/config/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import Toast from 'react-native-toast-message';

export default function SignUp({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const handleSignUp = async () => {
  
    setFirstNameError('');
    setLastNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

  
    if (!firstName.trim()) {
      setFirstNameError("El campo Nombre no está completado.");
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(firstName)) {
      setFirstNameError("El nombre solo puede contener letras y espacios.");
      return;
    }

  
    if (!lastName.trim()) {
      setLastNameError("El campo Apellido no está completado.");
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(lastName)) {
      setLastNameError("El apellido solo puede contener letras y espacios.");
      return;
    }

    if (!email.trim()) {
      setEmailError("El campo Correo no está completado.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Por favor ingrese un correo electrónico válido.");
      return;
    }

    if (!password.trim()) {
      setPasswordError("El campo Contraseña no está completado.");
      return;
    }

    if (!confirmPassword.trim()) {
      setConfirmPasswordError("El campo Confirmar Contraseña no está completado.");
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Las contraseñas no coinciden.");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/;
    if (!passwordRegex.test(password)) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres, incluyendo una letra mayúscula, una minúscula y un número.");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      Toast.show({
        type: 'success',
        text1: 'Registro exitoso',
        text2: 'Usuario registrado con éxito.'
      });
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); 
    } catch (error) {
      setFirstNameError('');
      setLastNameError('');
      setEmailError('');
      setPasswordError('');
      setConfirmPasswordError('');
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          setEmailError("El correo electrónico ya está en uso.");
          break;
        case 'auth/invalid-email':
          setEmailError("El formato del correo electrónico no es válido.");
          break;
        case 'auth/weak-password':
          setPasswordError("La contraseña es demasiado débil.");
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
            text1: 'Error de registro',
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
          <Text style={styles.title}>Regístrate</Text>
        
        <Text style={styles.label}>Nombre</Text>
        <View style={styles.inputContainer}>
          <FontAwesome name="user" size={20} color="#ccc" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Ingrese su nombre"
            value={firstName}
            onChangeText={(text) => setFirstName(text.replace(/[^a-zA-Z\s]/g, ''))}
          />
        </View>
        {firstNameError ? <Text style={styles.errorText}>{firstNameError}</Text> : null}

        <Text style={styles.label}>Apellido</Text>
        <View style={styles.inputContainer}>
          <FontAwesome name="user" size={20} color="#ccc" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Ingrese su apellido"
            value={lastName}
            onChangeText={(text) => setLastName(text.replace(/[^a-zA-Z\s]/g, ''))}
          />
        </View>
        {lastNameError ? <Text style={styles.errorText}>{lastNameError}</Text> : null}

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

        <Text style={styles.label}>Confirmar Contraseña</Text>
        <View style={styles.inputContainer}>
          <FontAwesome name="lock" size={20} color="#ccc" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Confirme su contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <FontAwesome name={showConfirmPassword ? "eye-slash" : "eye"} size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
        {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Registrarse</Text>
        </TouchableOpacity>


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
    paddingVertical: 70,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 20,
  },
  
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
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
    marginTop: 10,
    borderRadius: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signUpText: {
    marginTop: 20,
    color: '#007AFF',
  },
  errorText: {
    color: '#B50000',
    fontSize: 12,
    marginTop: -15,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
});

