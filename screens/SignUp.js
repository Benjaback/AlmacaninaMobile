import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ImageBackground } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { auth } from '../src/config/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import Toast from 'react-native-toast-message';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
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

  const [firstNameSuccess, setFirstNameSuccess] = useState('');
  const [lastNameSuccess, setLastNameSuccess] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [confirmPasswordSuccess, setConfirmPasswordSuccess] = useState('');

  const handleSignUp = async () => {

    setFirstNameError('');
    setLastNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Todos los campos son obligatorios.'
      });
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
          onChangeText={(text) => {
            const cleanedText = text.replace(/[^a-zA-Z\s]/g, '');
            setFirstName(cleanedText);
            if (!cleanedText.trim()) {
              setFirstNameError('Este campo es obligatorio');
              setFirstNameSuccess('');
            } else {
              setFirstNameError('');
              [/*setFirstNameSuccess('Campo válido');*/]
            }
          }}
        />
      </View>
      {firstNameError ? <Text style={styles.errorText}>{firstNameError}</Text> : null}
      {firstNameSuccess ? <Text style={styles.successText}>{firstNameSuccess}</Text> : null}

        <Text style={styles.label}>Apellido</Text>
        <View style={styles.inputContainer}>
          <FontAwesome name="user" size={20} color="#ccc" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Ingrese su apellido"
            value={lastName}
            onChangeText={(text) => {
              const cleanedText = text.replace(/[^a-zA-Z\s]/g, '');
              setLastName(cleanedText);
              if (!cleanedText.trim()) {
                setLastNameError('Este campo es obligatorio');
                setLastNameSuccess('');
              } else {
                setLastNameError('');
                [/*setLastNameSuccess('Campo válido');*/]
              }
            }}
          />
        </View>
        {lastNameError ? <Text style={styles.errorText}>{lastNameError}</Text> : null}
        {lastNameSuccess ? <Text style={styles.successText}>{lastNameSuccess}</Text> : null}

        <Text style={styles.label}>Correo</Text>
        <View style={styles.inputContainer}>
          <FontAwesome name="envelope" size={20} color="#ccc" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Ingrese su correo"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError('');
              setEmailSuccess('');
            }}
            onEndEditing={() => {
              const emailRegex = /^[^\s@]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
              if (!email.trim()) {
                setEmailError('Este campo es obligatorio');
                setEmailSuccess('');
              } else if (!emailRegex.test(email)) {
                setEmailError('Correo inválido');
                setEmailSuccess('');
              } else {
                setEmailError('');
                setEmailSuccess('Correo válido');
              }
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        {emailSuccess ? <Text style={styles.successText}>{emailSuccess}</Text> : null}

        <Text style={styles.label}>Contraseña</Text>
        <View style={styles.inputContainer}>
          <FontAwesome name="lock" size={20} color="#ccc" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Ingrese su contraseña"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/;
              if (!text.trim()) {
                setPasswordError('Este campo es obligatorio');
                setPasswordSuccess('');
              } else if (!passwordRegex.test(text)) {
                setPasswordError('La contraseña debe tener al menos 6 caracteres, una letra mayúscula, una minúscula y un número.');
                setPasswordSuccess('');
              } else {
                setPasswordError('');
                setPasswordSuccess('Campo válido');
              }
            }}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <FontAwesome name={showPassword ? "eye-slash" : "eye"} size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
        {passwordError ? <Text style={passwordError === 'Este campo es obligatorio' ? styles.errorText : styles.passwordErrorText}>{passwordError}</Text> : null}
        {passwordSuccess ? <Text style={styles.successText}>{passwordSuccess}</Text> : null}

        <Text style={styles.label}>Confirmar Contraseña</Text>
        <View style={styles.inputContainer}>
          <FontAwesome name="lock" size={20} color="#ccc" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Confirme su contraseña"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (!text.trim()) {
                setConfirmPasswordError('Este campo es obligatorio');
                setConfirmPasswordSuccess('');
              } else if (text !== password) {
                setConfirmPasswordError('Las contraseñas no coinciden.');
                setConfirmPasswordSuccess('');
              } else {
                setConfirmPasswordError('');
                setConfirmPasswordSuccess('Campo válido');
              }
            }}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <FontAwesome name={showConfirmPassword ? "eye-slash" : "eye"} size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
        {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
        {confirmPasswordSuccess ? <Text style={styles.successText}>{confirmPasswordSuccess}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Registrarse</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.contCambiarText} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.cambiarText}>¿Ya estás registrado?
            <Text style={styles.signUp}> Inicia sesión.</Text>
          </Text>
        </TouchableOpacity>


        </View>
      </KeyboardAwareScrollView>
      
      {/* Botón Atrás en esquina superior izquierda */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.navigate('Login')}
      >
        <View style={styles.iconContainer}>
          <MaterialIcons name="exit-to-app" size={35} color="black" />
        </View>
      </TouchableOpacity>
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
    width: '100%',
  },
  successText: {
    color: 'green',
    fontSize: 12,
    marginTop: -15,
    marginBottom: 10,
    alignSelf: 'flex-start',
    width: '100%',
  },
  passwordErrorText: {
    color: '#6e6c6cff',
    fontSize: 12,
    marginTop: -15,
    marginBottom: 10,
    alignSelf: 'flex-start',
    width: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  iconContainer: {
    transform: [{ rotate: '180deg' }],
  },
  backText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  contCambiarText: {
    top: 30,
  },
  cambiarText: {
    color: '#007AFF',
  },
  signUp:{
    textDecorationLine: 'underline',
  }
});

