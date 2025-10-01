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
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  
  // Estados para validación de contraseña en tiempo real
  const [passwordLength, setPasswordLength] = useState(false);
  const [hasUppercase, setHasUppercase] = useState(false);
  const [hasLowercase, setHasLowercase] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  
  
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

  // Función para validar contraseña en tiempo real
  const validatePassword = (text) => {
    setPasswordLength(text.length >= 6);
    setHasUppercase(/[A-Z]/.test(text));
    setHasLowercase(/[a-z]/.test(text));
    setHasNumber(/\d/.test(text));
  };

  const handleSignUp = async () => {

    setFirstNameError('');
    setLastNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // Check for empty fields and set errors if empty
    let hasError = false;
    if (!firstName.trim()) {
      setFirstNameError("Este campo es obligatorio.");
      hasError = true;
    }
    if (!lastName.trim()) {
      setLastNameError("Este campo es obligatorio.");
      hasError = true;
    }
    if (!email.trim()) {
      setEmailError("Este campo es obligatorio.");
      hasError = true;
    }
    if (!password.trim()) {
      setPasswordError("Este campo es obligatorio.");
      hasError = true;
    }
    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Este campo es obligatorio.");
      hasError = true;
    }
    if (hasError) {
      return;
    }



    if (password !== confirmPassword) {
      setConfirmPasswordError("Las contraseñas no coinciden.");
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
            text2: `No cumple com los requisitos`
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
              setFirstNameError('Este campo es obligatorio.');
              setFirstNameSuccess('');
            } else {
              setFirstNameError('');
              setFirstNameSuccess('Campo válido.');
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
                setLastNameError('Este campo es obligatorio.');
                setLastNameSuccess('');
              } else {
                setLastNameError('');
                setLastNameSuccess('Campo válido.');
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
                setEmailError('Este campo es obligatorio.');
                setEmailSuccess('');
              } else if (!emailRegex.test(email)) {
                setEmailError('Debe contener @ y un dominio válido.');
                setEmailSuccess('');
              } else {
                setEmailError('');
                setEmailSuccess('Campo válido.');
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
            onFocus={() => setShowPasswordRequirements(true)}
            onChangeText={(text) => {
              setPassword(text);
              validatePassword(text);
              
              // Re-evaluar confirmPassword si ya hay algo escrito
              if (confirmPassword) {
                const allRequirementsMet = text.length >= 6 && /[A-Z]/.test(text) && /[a-z]/.test(text) && /\d/.test(text);
                
                if (confirmPassword === text && allRequirementsMet) {
                  setConfirmPasswordError('');
                  setConfirmPasswordSuccess('Las contraseñas coinciden.');
                } else if (confirmPassword !== text) {
                  setConfirmPasswordError('Las contraseñas no coinciden.');
                  setConfirmPasswordSuccess('');
                } else {
                  setConfirmPasswordError('');
                  setConfirmPasswordSuccess('');
                }
              }
              
              const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/;
              if (!text.trim()) {
                setPasswordError('Este campo es obligatorio.');
                setPasswordSuccess('');
              } else if (!passwordRegex.test(text)) {
                setPasswordError('');
                setPasswordSuccess('');
              } else {
                setPasswordError('');
                setPasswordSuccess('Campo válido.');
              }
            }}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <FontAwesome name={showPassword ? "eye-slash" : "eye"} size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
        
        {/* Requisitos de contraseña */}
        {showPasswordRequirements && (
          <View style={styles.passwordRequirements}>
            <Text style={styles.requirementsTitle}>La contraseña debe tener:</Text>
            
            <View style={styles.requirementItem}>
              <FontAwesome 
                name={passwordLength ? "check-circle" : "circle-o"} 
                size={16} 
                color={passwordLength ? "#4CAF50" : "#ccc"} 
              />
              <Text style={[styles.requirementText, passwordLength && styles.requirementMet]}>
                Al menos 6 caracteres
              </Text>
            </View>
            
            <View style={styles.requirementItem}>
              <FontAwesome 
                name={hasUppercase ? "check-circle" : "circle-o"} 
                size={16} 
                color={hasUppercase ? "#4CAF50" : "#ccc"} 
              />
              <Text style={[styles.requirementText, hasUppercase && styles.requirementMet]}>
                Incluir al menos una letra mayúscula
              </Text>
            </View>
            
            <View style={styles.requirementItem}>
              <FontAwesome 
                name={hasLowercase ? "check-circle" : "circle-o"} 
                size={16} 
                color={hasLowercase ? "#4CAF50" : "#ccc"} 
              />
              <Text style={[styles.requirementText, hasLowercase && styles.requirementMet]}>
                Incluir letra minúscula
              </Text>
            </View>
            
            <View style={styles.requirementItem}>
              <FontAwesome 
                name={hasNumber ? "check-circle" : "circle-o"} 
                size={16} 
                color={hasNumber ? "#4CAF50" : "#ccc"} 
              />
              <Text style={[styles.requirementText, hasNumber && styles.requirementMet]}>
                Incluir al menos un número
              </Text>
            </View>
          </View>
        )}
        
        {passwordError ? <Text style={passwordError === 'Este campo es obligatorio.' ? styles.errorText : styles.passwordErrorText}>{passwordError}</Text> : null}
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
              // Verificar si todos los requisitos de contraseña están cumplidos
              const allRequirementsMet = passwordLength && hasUppercase && hasLowercase && hasNumber;
              
              if (!text.trim()) {
                setConfirmPasswordError('Este campo es obligatorio.');
                setConfirmPasswordSuccess('');
              } else if (text !== password) {
                setConfirmPasswordError('Las contraseñas no coinciden.');
                setConfirmPasswordSuccess('');
              } else if (text === password && allRequirementsMet) {
                setConfirmPasswordError('');
                setConfirmPasswordSuccess('Las contraseñas coinciden.');
              } else {
                setConfirmPasswordError('');
                setConfirmPasswordSuccess('');
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
  passwordRequirements: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 13,
    color: '#6c757d',
    marginLeft: 8,
  },
  requirementMet: {
    color: '#4CAF50',
    fontWeight: '500',
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

