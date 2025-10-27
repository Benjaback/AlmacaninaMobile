import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../src/config/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Toast from 'react-native-toast-message';

// Componente separado para mostrar cada campo de datos
const DataField = React.memo(({ icon, label, value, iconType = "FontAwesome", isEditable = false, isEditing, onChangeText, error, keyboardType = "default" }) => {
  const IconComponent = iconType === "MaterialIcons" ? MaterialIcons : FontAwesome;
  
  return (
    <View style={styles.dataField}>
      <View style={styles.fieldHeader}>
        <IconComponent name={icon} size={20} color="#8F08AA" style={styles.fieldIcon} />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      
      {isEditable && isEditing ? (
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.editInput, error ? styles.inputError : null]}
            value={value}
            onChangeText={onChangeText}
            placeholder={`Ingresa tu ${label.toLowerCase()}`}
            keyboardType={keyboardType}
            autoCapitalize={keyboardType === "default" ? "words" : "none"}
            blurOnSubmit={false}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      ) : (
        <View style={styles.valueContainer}>
          <Text style={[styles.fieldValue, !isEditable && styles.readOnlyValue]}>
            {value || 'No especificado'}
          </Text>
          {!isEditable && (
            <View style={styles.readOnlyBadge}>
              <FontAwesome name="lock" size={12} color="#666" />
              <Text style={styles.readOnlyText}>Solo lectura</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
});

export default function EditarPerfilScreen({ navigation }) {
  // Estados para datos del usuario
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dni: '',
    phone: '',
    fullName: ''
  });
  const [isConnected, setIsConnected] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // Estados para los campos editables
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editDni, setEditDni] = useState('');
  const [editPhone, setEditPhone] = useState('');
  
  // Estados para validación
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    dni: '',
    phone: ''
  });

  // Función para obtener datos del usuario
  const fetchUserData = async (user) => {
    try {
      if (!user) return;

      // Guardar el UID del usuario
      setCurrentUserId(user.uid);

      // Datos básicos del auth
      const basicData = {
        email: user.email || '',
        firstName: '',
        lastName: '',
        dni: '',
        phone: '',
        fullName: user.displayName || ''
      };

      try {
        // Intentar obtener datos adicionales desde Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const firestoreData = userDoc.data();
          const userData = {
            firstName: firestoreData.firstName || '',
            lastName: firestoreData.lastName || '',
            email: user.email || '',
            dni: firestoreData.dni || '',
            phone: firestoreData.phone || '',
            fullName: firestoreData.fullName || 
                     (firestoreData.firstName && firestoreData.lastName ? 
                      `${firestoreData.firstName} ${firestoreData.lastName}` : '') ||
                     user.displayName || ''
          };
          setUserData(userData);
          
          // Inicializar campos de edición
          setEditFirstName(userData.firstName);
          setEditLastName(userData.lastName);
          setEditDni(userData.dni);
          setEditPhone(userData.phone);
          
        } else {
          // Si no existe documento en Firestore, usar datos básicos
          setUserData(basicData);
          setEditFirstName(basicData.firstName);
          setEditLastName(basicData.lastName);
          setEditDni(basicData.dni);
          setEditPhone(basicData.phone);
        }
      } catch (firestoreError) {
        console.log('Error accediendo a Firestore:', firestoreError);
        
        if (firestoreError.code === 'unavailable' || 
            firestoreError.message.includes('offline')) {
          setIsConnected(false);
          Toast.show({
            type: 'info',
            text1: 'Modo offline',
            text2: 'Mostrando datos básicos disponibles',
            visibilityTime: 3000,
          });
        }
        
        // Usar datos básicos en caso de error
        setUserData(basicData);
        setEditFirstName(basicData.firstName);
        setEditLastName(basicData.lastName);
        setEditDni(basicData.dni);
        setEditPhone(basicData.phone);
      }
      
    } catch (error) {
      console.error('Error general obteniendo datos:', error);
      Alert.alert(
        'Error',
        'No se pudieron cargar los datos del perfil. Por favor, inténtalo de nuevo.',
        [{ text: 'Entendido' }]
      );
    }
  };

  // Función para validar los datos
  const validateData = () => {
    const newErrors = {
      firstName: '',
      lastName: '',
      dni: '',
      phone: ''
    };

    // Validar campos obligatorios con Toast
    if (!editFirstName.trim() || !editLastName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Campos obligatorios',
        text2: 'El nombre y apellido son obligatorios',
        visibilityTime: 4000,
      });
      return false;
    }

    // Validar nombre (errores en campo como antes)
    if (editFirstName.trim().length < 2) {
      newErrors.firstName = 'El nombre debe tener al menos 2 caracteres';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(editFirstName.trim())) {
      newErrors.firstName = 'El nombre solo puede contener letras';
    }

    // Validar apellido (errores en campo como antes)
    if (editLastName.trim().length < 2) {
      newErrors.lastName = 'El apellido debe tener al menos 2 caracteres';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(editLastName.trim())) {
      newErrors.lastName = 'El apellido solo puede contener letras';
    }

    // Validar DNI (errores en campo como antes)
    if (editDni.trim() && !/^\d{7,8}$/.test(editDni.trim())) {
      newErrors.dni = 'DNI debe tener 7 u 8 dígitos';
    }

    // Validar teléfono (errores en campo como antes)
    if (editPhone.trim() && !/^[\+]?[0-9\s\-\(\)]{8,15}$/.test(editPhone.trim())) {
      newErrors.phone = 'Formato de teléfono inválido (8-15 dígitos)';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  // Función para guardar los cambios
  const handleSaveChanges = async () => {
    if (!validateData()) {
      return;
    }

    if (!currentUserId) {
      Alert.alert('Error', 'No se pudo identificar al usuario');
      return;
    }

    try {
      // Preparar datos actualizados
      const updatedData = {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        dni: editDni.trim(),
        phone: editPhone.trim(),
        fullName: `${editFirstName.trim()} ${editLastName.trim()}`,
        updatedAt: new Date().toISOString()
      };

      // Actualizar en Firestore
      await updateDoc(doc(db, 'users', currentUserId), updatedData);

      // Actualizar estado local
      setUserData(prev => ({
        ...prev,
        ...updatedData
      }));

      // Salir del modo edición
      setIsEditing(false);

      Toast.show({
        type: 'success',
        text1: 'Perfil actualizado',
        text2: 'Los cambios se guardaron correctamente',
        visibilityTime: 3000,
      });

    } catch (error) {
      console.error('Error guardando datos:', error);
      Alert.alert(
        'Error',
        'No se pudieron guardar los cambios. Por favor, inténtalo de nuevo.',
        [{ text: 'Entendido' }]
      );
    }
  };

  // Función para cancelar edición
  const handleCancelEdit = () => {
    // Restaurar valores originales
    setEditFirstName(userData.firstName);
    setEditLastName(userData.lastName);
    setEditDni(userData.dni);
    setEditPhone(userData.phone);
    
    // Limpiar errores
    setErrors({
      firstName: '',
      lastName: '',
      dni: '',
      phone: ''
    });
    
    // Salir del modo edición
    setIsEditing(false);
  };

  // Función para manejar la edición
  const handleEditProfile = useCallback(() => {
    setIsEditing(true);
  }, []);

  // Optimizar las funciones de cambio de texto
  const handleFirstNameChange = useCallback((text) => {
    // Filtrar solo letras, espacios y acentos (bloquear números)
    const filteredText = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    setEditFirstName(filteredText);
  }, []);

  const handleLastNameChange = useCallback((text) => {
    // Filtrar solo letras, espacios y acentos (bloquear números)
    const filteredText = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    setEditLastName(filteredText);
  }, []);

  const handleDniChange = useCallback((text) => {
    setEditDni(text);
  }, []);

  const handlePhoneChange = useCallback((text) => {
    setEditPhone(text);
  }, []);

  // useEffect para obtener datos del usuario autenticado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchUserData(user);
      } else {
        navigation.replace('Login');
      }
    });

    return unsubscribe;
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Indicador de conexión */}
        {!isConnected && (
          <View style={styles.offlineIndicator}>
            <FontAwesome name="wifi" size={16} color="#ff6b6b" />
            <Text style={styles.offlineText}>Modo offline - Datos limitados</Text>
          </View>
        )}

        {/* Sección de Datos Personales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos Personales</Text>
          
          <DataField
            icon="user"
            label="Nombre"
            value={isEditing ? editFirstName : userData.firstName}
            isEditable={true}
            isEditing={isEditing}
            onChangeText={handleFirstNameChange}
            error={errors.firstName}
          />
          
          <DataField
            icon="user"
            label="Apellido"
            value={isEditing ? editLastName : userData.lastName}
            isEditable={true}
            isEditing={isEditing}
            onChangeText={handleLastNameChange}
            error={errors.lastName}
          />
          
          <DataField
            icon="envelope"
            label="Correo Electrónico"
            value={userData.email}
            isEditable={false}
            isEditing={isEditing}
          />
          
          <DataField
            icon="mobile"
            label="Teléfono"
            value={isEditing ? editPhone : userData.phone}
            isEditable={true}
            isEditing={isEditing}
            onChangeText={handlePhoneChange}
            error={errors.phone}
            keyboardType="phone-pad"
            iconType="FontAwesome"
          />
          
          <DataField
            icon="id-card"
            label="DNI"
            value={isEditing ? editDni : userData.dni}
            isEditable={true}
            isEditing={isEditing}
            onChangeText={handleDniChange}
            error={errors.dni}
            keyboardType="numeric"
            iconType="FontAwesome"
          />
        </View>

        {/* Información adicional */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <FontAwesome name="info-circle" size={16} color="#666" />
            <Text style={styles.infoText}>
              Mantén tu información actualizada
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <FontAwesome name="shield" size={16} color="#666" />
            <Text style={styles.infoText}>
              Tus datos están protegidos y seguros
            </Text>
          </View>
        </View>

        {/* Botón de Editar o Guardar/Cancelar */}
        <View style={styles.editSection}>
          {isEditing ? (
            <View style={styles.editButtonsContainer}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancelEdit}
                activeOpacity={0.8}
              >
                <FontAwesome name="times" size={18} color="#ffffffff" />
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSaveChanges}
                activeOpacity={0.8}
              >
                <FontAwesome name="check" size={18} color="#fff" />
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={handleEditProfile}
              activeOpacity={0.8}
            >
              <FontAwesome name="edit" size={20} color="#fff" />
              <Text style={styles.editButtonText}>Editar Perfil</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Espaciado inferior */}
        <View style={{ height: 40 }} />
        
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
  scrollContent: {
    paddingBottom: 40,
  },
  
  // Offline indicator
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff3cd',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#B50000',
  },
  offlineText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#856404',
  },
  
  // Section styles
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 10,
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
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  
  // Data field styles
  dataField: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldIcon: {
    marginRight: 10,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginLeft: 30,
  },
  
  // Nuevos estilos para campos editables
  valueContainer: {
    marginLeft: 30,
  },
  readOnlyValue: {
    color: '#666',
  },
  readOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  readOnlyText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  inputContainer: {
    marginLeft: 30,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  inputError: {
    borderColor: '#B50000',
  },
  errorText: {
    fontSize: 12,
    color: '#B50000',
    marginTop: 4,
  },
  
  // Info section
  infoSection: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 20,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    flex: 1,
  },
  
  // Edit button section
  editSection: {
    marginHorizontal: 15,
    marginTop: 30,
  },
  editButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  editButton: {
    backgroundColor: '#8F08AA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  editButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#B50000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#ffffffff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flex: 1,
    borderWidth: 1,
    borderColor: '#B50000',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffffff',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#8F08AA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    flex: 1,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
});