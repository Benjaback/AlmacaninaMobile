import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../src/config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';

export default function PantallaPerfil({ navigation }) {
  // Estados para datos del usuario desde Firebase
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userInitials, setUserInitials] = useState('U');
  const [loading, setLoading] = useState(true);
  
  // Estados para ImagePicker
  const [userImage, setUserImage] = useState(null);

  // Función para generar iniciales del nombre
  const getInitials = (name) => {
    // Si no hay nombres validos se muestra la U
    if (!name || name.trim() === '') return 'U';
    //quita los espacios al inicio despues lo separa por espacio, crea un array y elimina los elementos vacios
    const names = name.trim().split(' ').filter(n => n.length > 0);
    // TOma la primera letra del primer nombre y la convierte en mayusucla
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    // Toma la primera letra del primer nombre y la primera letra del ultimo nombre y las convierte en mayuscula
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // manejar la selección de imagen
  const handleImagePicker = () => {
    Alert.alert(
      'Actualizar Foto de Perfil',
      '¿Desde dónde quieres seleccionar tu nueva foto de perfil?',
      [
        {
          text: 'Abrir Cámara',
          onPress: openCamera,
          style: 'default',
        },
        {
          text: 'Elegir de Galería',
          onPress: openGallery,
          style: 'default',
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ],
      {
        cancelable: true,
        userInterfaceStyle: 'light',
      }
    );
  };

  // Función para abrir cámara
  const openCamera = async () => {
    try {
      // Pedir permisos de cámara
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (cameraPermission.granted === false) {
        Alert.alert(
          'Permisos Requeridos',
          'Para tomar fotos necesitamos acceso a tu cámara. Por favor, habilita los permisos en la configuración de la aplicación.',
          [{ text: 'Entendido', style: 'default' }]
        );
        return;
      }

      // Abrir cámara
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Cuadrada para avatar
        quality: 0.7,
      });

      if (!result.canceled) {
        setUserImage(result.assets[0].uri);
        console.log('Imagen tomada:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al tomar foto:', error);
      Alert.alert(
        'Error de Cámara',
        'No se pudo acceder a la cámara en este momento. Por favor, inténtalo de nuevo.',
        [{ text: 'Cerrar', style: 'default' }]
      );
    }
  };

  // abrir galería
  const openGallery = async () => {
    try {
      // Pedir permisos de galería
      const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (galleryPermission.granted === false) {
        Alert.alert(
          'Permisos Requeridos',
          'Para acceder a tus fotos necesitamos permisos de galería. Por favor, habilita los permisos en la configuración de la aplicación.',
          [{ text: 'Entendido', style: 'default' }]
        );
        return;
      }

      // Abrir galería
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Cuadrada para avatar
        quality: 0.7,
      });

      if (!result.canceled) {
        setUserImage(result.assets[0].uri);
        console.log('Imagen seleccionada:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert(
        'Error de Galería',
        'No se pudo acceder a la galería en este momento. Por favor, inténtalo de nuevo.',
        [{ text: 'Cerrar', style: 'default' }]
      );
    }
  };

  // CIerre de sesion
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
                text2: '¡Vuelve Pronto! 🐾',
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

  // useEffect para obtener datos del usuario autenticado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Obtener email del usuario
          setUserEmail(user.email || '');
          
          // Intentar obtener datos adicionales desde Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const fullName = userData.fullName || 
                           (userData.firstName && userData.lastName ? 
                            `${userData.firstName} ${userData.lastName}` : '') || 
                           user.displayName || '';
            
            if (fullName && fullName.trim() !== '') {
              setUserName(fullName);
              setUserInitials(getInitials(fullName));
            } else {
              // Si no hay nombre completo, usar parte del email
              const emailName = user.email.split('@')[0];
              const formattedName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
              setUserName(formattedName);
              setUserInitials(getInitials(formattedName));
            }
          } else {
            // Si no existe documento en Firestore, usar datos básicos
            const displayName = user.displayName || user.email.split('@')[0];
            const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
            setUserName(formattedName);
            setUserInitials(getInitials(formattedName));
          }
          
        } catch (error) {
          console.log('Error obteniendo datos del usuario:', error);
          // En caso de error, usar datos básicos del usuario
          const fallbackName = user.displayName || user.email.split('@')[0];
          const formattedName = fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1);
          setUserName(formattedName);
          setUserInitials(getInitials(formattedName));
        }
        
        setLoading(false);
      } else {
        // Usuario no autenticado
        setUserName('');
        setUserEmail('');
        setUserInitials('U');
        setLoading(false);
      }
    });

    return unsubscribe; // Limpiar el listener al desmontar
  }, []);
  // esto sirve para los iconos
  const MenuItem = ({ icon, title, subtitle, onPress, iconType = "FontAwesome" }) => {
    const IconComponent = iconType === "MaterialIcons" ? MaterialIcons : 
                         iconType === "Ionicons" ? Ionicons : FontAwesome;
    // Se puede agregar más tipos de iconos
    return (
      <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={styles.menuIconContainer}>
          <IconComponent name={icon} size={24} color="#8F08AA" />
        </View>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        </View>
        <FontAwesome name="chevron-right" size={16} color="#ccc" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header con foto de perfil */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handleImagePicker}
          >
            <View style={styles.avatar}>
              {userImage ? (
                <Image 
                  source={{ uri: userImage }} 
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarText}>{userInitials}</Text>
              )}
            </View>
            <View style={styles.cameraIcon}>
              <FontAwesome name="camera" size={12} color="#fff" />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.userName}>{userName || 'Mi Perfil'}</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>
        </View>

        {/* Sección Mi Cuenta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mi Cuenta</Text>
          
          <MenuItem
            icon="user"
            title="Ver Perfil"
            subtitle="Ver nombre, apellido y datos personales"
            onPress={() => navigation.navigate('EditarPerfil')}
          />
          
          <MenuItem
            icon="lock"
            title="Cambiar Contraseña"
            subtitle="Actualizar tu contraseña de acceso"
            onPress={() => {/* Navegar a pantalla de cambio de contraseña */}}
          />
        </View>

        {/* Sección Información */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
          
          <MenuItem
            icon="info-circle"
            title="Acerca de AlmaCanina"
            subtitle="Versión beta"
            onPress={() => {/* Mostrar la info de acerca de AlmaCanina */}}
          />
          
          <MenuItem
            icon="file-text"
            title="Términos y Condiciones"
            onPress={() => {/* MOstrar terminos y condiciones */}}
          />
          
          <MenuItem
            icon="shield"
            title="Política de Privacidad"
            onPress={() => {/* Mostrar política de privacidad */}}
          />
        </View>

        {/* Botón Cerrar Sesión */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogOut}>
            <FontAwesome name="sign-out" size={20} color="#8F08AA" />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        {/* Espaciado inferior */}
        <View style={{ height: 30 }} />
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  
  // Header styles
  header: {
    backgroundColor: 'gold',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#8F08AA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#000000ff',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },

  // Section styles
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },

  // Menu item styles
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },

  // Logout section
  logoutSection: {
    marginHorizontal: 45,
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#8F08AA',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000ff',
    marginLeft: 10,
  },
});