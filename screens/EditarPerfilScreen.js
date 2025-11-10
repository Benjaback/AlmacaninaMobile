import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../src/config/firebaseConfig';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Toast from 'react-native-toast-message';

//paleta de colores
const COLORS = {
  primaryPurple: '#8F08AA',
  secondaryYellow: '#FFC107',
  textDark: '#212121',
  textLight: '#FFFFFF',
  backgroundLight: '#f5f5f5',
  cardBackground: '#FFFFFF',
  shadowColor: '#000000',
  buttonText: '#FFFFFF',
  lowStockRed: '#D32F2F',
  safeStockGreen: '#4CAF50',
};

// --- COMPONENTE MODAL DE ALERTA PERSONALIZADO ---
const CustomAlertModal = ({ isVisible, title, message, onConfirm, onCancel, confirmText = 'ACEPTAR', cancelText, type = 'default' }) => {
  const { primaryPurple, secondaryYellow, textLight, textDark, lowStockRed } = COLORS;
  
  let accentColor = primaryPurple;
  let confirmBg = primaryPurple;
  let cancelBg = secondaryYellow;
  let cancelTextColor = textDark;

  if (type === 'error') {
    accentColor = lowStockRed;
    confirmBg = lowStockRed;
  } else if (type === 'info') {
    accentColor = '#03A9F4';
    confirmBg = primaryPurple;
  }
  
  if (!onCancel) {
    confirmBg = accentColor;
  }

  if (!isVisible) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onCancel || onConfirm}
    >
      <Pressable style={alertStyles.centeredView} onPress={onCancel || onConfirm}>
        <View style={[alertStyles.modalView, { borderTopColor: accentColor }]}>
          <Text style={[alertStyles.modalTitle, { color: accentColor }]}>{title}</Text>
          <Text style={alertStyles.modalMessage}>{message}</Text>

          <View style={alertStyles.buttonContainer}>
            {onCancel && (
              <TouchableOpacity
                style={[alertStyles.button, { backgroundColor: cancelBg }]}
                onPress={onCancel}
                activeOpacity={0.8}
              >
                <Text style={[alertStyles.textStyle, { color: cancelTextColor }]}>
                  {cancelText || 'CANCELAR'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                onCancel ? alertStyles.button : alertStyles.singleButton, 
                { backgroundColor: confirmBg }
              ]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={[alertStyles.textStyle, { color: textLight }]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};
// --- FIN COMPONENTE MODAL DE ALERTA PERSONALIZADO ---

// Componente separado para mostrar cada campo de datos
const DataField = React.memo(({ icon, label, value, iconType = "FontAwesome", isEditable = false, isEditing, onChangeText, error, keyboardType = "default", maxLength, prefix }) => {
  const IconComponent = iconType === "MaterialIcons" ? MaterialIcons : FontAwesome;
  
  return (
    <View style={styles.dataField}>
      <View style={styles.fieldHeader}>
        <IconComponent name={icon} size={20} color="#8F08AA" style={styles.fieldIcon} />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      
      {isEditable && isEditing ? (
        <View style={styles.inputContainer}>
          {prefix ? (
            <View style={styles.inputWithPrefix}>
              <Text style={styles.prefixText}>{prefix}</Text>
              <TextInput
                style={[
                  styles.editInput, 
                  error ? styles.inputError : null,
                  styles.inputWithPrefixText
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder="1112345678"
                keyboardType={keyboardType}
                autoCapitalize={keyboardType === "default" ? "words" : "none"}
                blurOnSubmit={false}
              />
            </View>
          ) : (
            <TextInput
              style={[
                styles.editInput, 
                error ? styles.inputError : null
              ]}
              value={value}
              onChangeText={onChangeText}
              placeholder={`Ingresa tu ${label.toLowerCase()}`}
              keyboardType={keyboardType}
              autoCapitalize={keyboardType === "default" ? "words" : "none"}
              blurOnSubmit={false}
            />
          )}
          {maxLength && (
            <Text style={styles.characterCounter}>
              {value ? value.length : 0}/{maxLength}
            </Text>
          )}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      ) : (
        <View style={styles.valueContainer}>
          <Text style={[styles.fieldValue, !isEditable && styles.readOnlyValue]}>
            {prefix && value ? 
              (value.startsWith(prefix) ? value : `${prefix} ${value}`) : 
              value || 'No especificado'}
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

  // ESTADO para controlar el modal de alerta/confirmación
  const [customAlertData, setCustomAlertData] = useState({
    isVisible: false,
    title: '',
    message: '',
    onConfirm: () => setCustomAlertData(prev => ({ ...prev, isVisible: false })),
    onCancel: null,
    confirmText: 'ACEPTAR',
    type: 'default',
  });
  
  // Función centralizada para mostrar el CustomAlertModal
  const showCustomAlert = (title, message, onConfirm, onCancel = null, confirmText = 'ACEPTAR', type = 'default') => {
    setCustomAlertData({
      isVisible: true,
      title,
      message,
      onConfirm,
      onCancel,
      confirmText,
      type,
    });
  };

  // Referencias para debounce de validación (evitar re-renders)
  const dniValidationTimeout = useRef(null);
  const phoneValidationTimeout = useRef(null);
  
  // Referencia para el ScrollView
  const scrollViewRef = useRef(null);

  // Función helper para inicializar campos de edición
  const initializeEditFields = useCallback((data) => {
    setEditFirstName(data.firstName || '');
    setEditLastName(data.lastName || '');
    setEditDni(data.dni || '');
    setEditPhone(data.phone ? data.phone.replace(/^\+54\s?/, '') : '');
  }, []);

  // Función helper para limpiar errores
  const clearErrors = useCallback(() => {
    setErrors({
      firstName: '',
      lastName: '',
      dni: '',
      phone: ''
    });
  }, []);

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
          initializeEditFields(userData);
          
        } else {
          // Si no existe documento en Firestore, usar datos básicos
          setUserData(basicData);
          initializeEditFields(basicData);
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
        initializeEditFields(basicData);
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

  // Función para verificar unicidad del DNI
  const checkDniUniqueness = async (dni) => {
    try {
      // No verificar si el DNI está vacío
      if (!dni.trim()) return true;
      
      // Crear consulta para buscar usuarios con el mismo DNI
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('dni', '==', dni.trim()));
      const querySnapshot = await getDocs(q);
      
      // Si encontramos documentos, verificar que no sea el usuario actual
      if (!querySnapshot.empty) {
        for (const doc of querySnapshot.docs) {
          // Si el DNI pertenece a otro usuario (no al actual), es duplicado
          if (doc.id !== currentUserId) {
            return false;
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error verificando unicidad del DNI:', error);
      // En caso de error, permitir continuar (no bloquear por error de red)
      return true;
    }
  };

  // Función para verificar unicidad del teléfono
  const checkPhoneUniqueness = async (phone) => {
    try {
      // No verificar si el teléfono está vacío
      if (!phone.trim()) return true;
      
      // Normalizar teléfono para comparación (sin espacios, guiones, paréntesis)
      const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
      
      // Crear consulta para buscar usuarios con el mismo teléfono
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phone', '==', phone.trim()));
      const querySnapshot = await getDocs(q);
      
      // Si encontramos documentos, verificar que no sea el usuario actual
      if (!querySnapshot.empty) {
        for (const doc of querySnapshot.docs) {
          // Si el teléfono pertenece a otro usuario (no al actual), es duplicado
          if (doc.id !== currentUserId) {
            return false;
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error verificando unicidad del teléfono:', error);
      // En caso de error, permitir continuar (no bloquear por error de red)
      return true;
    }
  };

  // Función para validar los datos
  const validateData = async () => {
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
    } else if (editFirstName.trim().length > 20) {
      newErrors.firstName = 'El nombre no puede exceder 20 caracteres';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(editFirstName.trim())) {
      newErrors.firstName = 'El nombre solo puede contener letras';
    }

    // Validar apellido (errores en campo como antes)
    if (editLastName.trim().length < 2) {
      newErrors.lastName = 'El apellido debe tener al menos 2 caracteres';
    } else if (editLastName.trim().length > 20) {
      newErrors.lastName = 'El apellido no puede exceder 20 caracteres';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(editLastName.trim())) {
      newErrors.lastName = 'El apellido solo puede contener letras';
    }

    // Validar DNI - SIEMPRE validar si hay DNI
    if (editDni.trim()) {
      const dniValue = editDni.trim();
      const dniNumber = parseInt(dniValue, 10);
      
      // Validar formato básico (7-8 dígitos)
      if (!/^\d{7,8}$/.test(dniValue)) {
        newErrors.dni = 'DNI inválido. Debe contener entre 7 y 8 números (ej: 12345678)';
      }
      // Validar rangos realistas
      else if (dniNumber < 1000000) {
        newErrors.dni = 'DNI muy bajo. Los DNI actuales comienzan desde 1.000.000';
      } else if (dniNumber > 99999999) {
        newErrors.dni = 'DNI muy alto. Los DNI actuales no superan 99.999.999';
      } else if (dniNumber > 60000000) {
        newErrors.dni = 'DNI muy alto para la época actual. Verifique el número ingresado';
      }
      // Validar que no sean todos números iguales
      else if (/^(\d)\1+$/.test(dniValue)) {
        newErrors.dni = 'DNI inválido. No puede contener todos los dígitos iguales';
      }
      // Validar que no sean números consecutivos simples
      else if (/^(01234567|12345678|23456789|87654321|76543210|65432109|54321098|43210987|32109876|21098765|10987654)$/.test(dniValue)) {
        newErrors.dni = 'DNI inválido. No puede ser una secuencia consecutiva';
      }
      // Validar unicidad del DNI (solo si pasó todas las demás validaciones)
      else {
        const isUnique = await checkDniUniqueness(dniValue);
        if (!isUnique) {
          newErrors.dni = 'Este DNI ya está registrado por otro usuario';
        }
      }
    }

    // Validar teléfono - SIEMPRE validar si hay teléfono
    if (editPhone.trim()) {
      const phoneValue = editPhone.trim();
      
      // Validar formato nacional argentino (solo números)
      if (!/^[0-9]{8,12}$/.test(phoneValue)) {
        newErrors.phone = 'Formato inválido (ej: 1112345678)';
      }
      // Validar números consecutivos o repetitivos
      else if (/^(\d)\1+$/.test(phoneValue)) {
        newErrors.phone = 'Teléfono inválido. No puede contener todos los dígitos iguales';
      }
      // Validar secuencias consecutivas simples
      else if (/^(01234567|12345678|23456789|34567890|87654321|76543210|65432109|54321098|43210987|32109876|21098765|10987654)/.test(phoneValue)) {
        newErrors.phone = 'Teléfono inválido. No puede ser una secuencia consecutiva';
      }
      // Validar unicidad del teléfono (solo si pasó todas las demás validaciones)
      else {
        const fullPhoneNumber = `+54 ${phoneValue}`;
        const isUnique = await checkPhoneUniqueness(fullPhoneNumber);
        if (!isUnique) {
          newErrors.phone = 'Este teléfono ya está registrado por otro usuario';
        }
      }
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  // Función para guardar los cambios
  const handleSaveChanges = async () => {
    // Mostrar alerta de confirmación antes de guardar usando CustomAlertModal
    const onConfirm = async () => {
      setCustomAlertData(prev => ({ ...prev, isVisible: false }));
      
      // Proceder con la validación y guardado
      if (!(await validateData())) {
        return;
      }

      if (!currentUserId) {
        showCustomAlert(
          'Error',
          'No se pudo identificar al usuario',
          () => setCustomAlertData(prev => ({ ...prev, isVisible: false })),
          null,
          'ENTENDIDO',
          'error'
        );
        return;
      }

      try {
        // Preparar datos actualizados
        const updatedData = {
          firstName: editFirstName.trim(),
          lastName: editLastName.trim(),
          dni: editDni.trim(),
          phone: editPhone.trim() ? 
            (editPhone.trim().startsWith('+54') ? editPhone.trim() : `+54 ${editPhone.trim()}`) : '', // Evitar duplicar +54
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
        showCustomAlert(
          'Error',
          'No se pudieron guardar los cambios. Por favor, inténtalo de nuevo.',
          () => setCustomAlertData(prev => ({ ...prev, isVisible: false })),
          null,
          'ENTENDIDO',
          'error'
        );
      }
    };

    const onCancel = () => {
      setCustomAlertData(prev => ({ ...prev, isVisible: false }));
    };

    showCustomAlert(
      'Confirmar cambios',
      '¿Estás seguro de que quieres guardar los cambios en tu perfil?',
      onConfirm,
      onCancel,
      'GUARDAR',
      'default'
    );
  };

  // Función para cancelar edición
  const handleCancelEdit = () => {
    // Verificar si hay cambios sin guardar
    if (hasChanges()) {
      const onConfirm = () => {
        setCustomAlertData(prev => ({ ...prev, isVisible: false }));
        // Restaurar valores originales
        initializeEditFields(userData);
        
        // Limpiar errores
        clearErrors();
        
        // Salir del modo edición
        setIsEditing(false);
      };

      const onCancel = () => {
        setCustomAlertData(prev => ({ ...prev, isVisible: false }));
      };

      showCustomAlert(
        'Descartar cambios',
        '¿Estás seguro de que quieres descartar los cambios realizados?',
        onConfirm,
        onCancel,
        'DESCARTAR',
        'error'
      );
    } else {
      // Si no hay cambios, cancelar directamente
      // Restaurar valores originales
      initializeEditFields(userData);
      
      // Limpiar errores
      clearErrors();
      
      // Salir del modo edición
      setIsEditing(false);
    }
  };

  // Función para manejar la edición
  const handleEditProfile = useCallback(() => {
    setIsEditing(true);
  }, []);

  // Función para volver al perfil
  const handleBackToProfile = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Función para verificar si hay cambios
  const hasChanges = useCallback(() => {
    return (
      editFirstName.trim() !== userData.firstName ||
      editLastName.trim() !== userData.lastName ||
      editDni.trim() !== userData.dni ||
      editPhone.trim() !== userData.phone
    );
  }, [editFirstName, editLastName, editDni, editPhone, userData]);

  // Optimizar las funciones de cambio de texto
  const handleFirstNameChange = useCallback((text) => {
    // Filtrar solo letras, espacios y acentos (bloquear números)
    const filteredText = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    // Limitar a máximo 20 caracteres
    const limitedText = filteredText.slice(0, 20);
    setEditFirstName(limitedText);
  }, []);

  const handleLastNameChange = useCallback((text) => {
    // Filtrar solo letras, espacios y acentos (bloquear números)
    const filteredText = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    // Limitar a máximo 20 caracteres
    const limitedText = filteredText.slice(0, 20);
    setEditLastName(limitedText);
  }, []);

  const handleDniChange = useCallback((text) => {
    // Filtrar solo números (bloquear letras y símbolos)
    const filteredText = text.replace(/[^0-9]/g, '');
    setEditDni(filteredText);
    
    // Limpiar timeout anterior
    if (dniValidationTimeout.current) {
      clearTimeout(dniValidationTimeout.current);
    }
    
    // Validación inmediata de formato
    let dniError = '';
    
    if (filteredText.trim()) {
      const dniValue = filteredText.trim();
      const dniNumber = parseInt(dniValue, 10);
      
      // Validar formato básico (7-8 dígitos)
      if (dniValue.length > 0 && dniValue.length < 7) {
        dniError = 'DNI debe tener entre 7 y 8 dígitos';
      } else if (dniValue.length > 8) {
        dniError = 'DNI no puede tener más de 8 dígitos';
      } else if (dniValue.length >= 7 && !/^\d{7,8}$/.test(dniValue)) {
        dniError = 'DNI inválido. Debe contener entre 7 y 8 números (ej: 12345678)';
      }
      // Validar que no sean todos números iguales (independiente de otras validaciones)
      else if (dniValue.length >= 7 && /^(\d)\1+$/.test(dniValue)) {
        dniError = 'DNI inválido. No puede contener todos los dígitos iguales';
      }
      // Validar que no sean números consecutivos simples (independiente de otras validaciones)
      else if (dniValue.length >= 7 && /^(01234567|12345678|23456789|87654321|76543210|65432109|54321098|43210987|32109876|21098765|10987654)$/.test(dniValue)) {
        dniError = 'DNI inválido. No puede ser una secuencia consecutiva';
      }
      // Validar rangos realistas de DNI argentinos (solo si pasó las validaciones anteriores)
      else if (dniValue.length >= 7) {
        if (dniNumber < 1000000) {
          dniError = 'DNI muy bajo. Los DNI actuales comienzan desde 1.000.000';
        } else if (dniNumber > 99999999) {
          dniError = 'DNI muy alto. Los DNI actuales no superan 99.999.999';
        } else if (dniNumber > 60000000) {
          dniError = 'DNI muy alto para la época actual. Verifique el número ingresado';
        }
      }
    }
    
    // Actualizar error inmediatamente para validaciones de formato
    setErrors(prev => ({
      ...prev,
      dni: dniError
    }));
    
    // Validación de unicidad con debounce (solo si formato es válido)
    if (!dniError && filteredText.length >= 7 && filteredText.length <= 8) {
      const timeout = setTimeout(async () => {
        try {
          const isUnique = await checkDniUniqueness(filteredText);
          if (!isUnique) {
            setErrors(prev => ({
              ...prev,
              dni: 'Este DNI ya está registrado por otro usuario'
            }));
          }
        } catch (error) {
          console.log('Error verificando unicidad en tiempo real:', error);
        }
      }, 1000); // Esperar 1 segundo después de que el usuario deje de escribir
      
      dniValidationTimeout.current = timeout;
    }
  }, [currentUserId]);

  const handlePhoneChange = useCallback((text) => {
    // Filtrar solo números
    const filteredText = text.replace(/[^0-9]/g, '');
    setEditPhone(filteredText);
    
    // Limpiar timeout anterior
    if (phoneValidationTimeout.current) {
      clearTimeout(phoneValidationTimeout.current);
    }
    
    // Validación inmediata de formato para números nacionales
    let phoneError = '';
    
    if (filteredText.trim()) {
      const phoneValue = filteredText.trim();
      
      // Validar longitud (números nacionales argentinos: 8-12 dígitos)
      if (phoneValue.length > 0 && phoneValue.length < 8) {
        phoneError = 'Teléfono debe tener al menos 8 dígitos';
      } else if (phoneValue.length > 12) {
        phoneError = 'Teléfono no puede tener más de 12 dígitos';
      }
      // Validar formato nacional argentino (solo números)
      else if (phoneValue.length >= 8 && !/^[0-9]{8,12}$/.test(phoneValue)) {
        phoneError = 'Formato inválido (ej: 1112345678)';
      }
      // Validar números consecutivos o repetitivos
      else if (phoneValue.length >= 8) {
        // Validar que no sean todos números iguales
        if (/^(\d)\1+$/.test(phoneValue)) {
          phoneError = 'Teléfono inválido. No puede contener todos los dígitos iguales';
        }
        // Validar secuencias consecutivas simples
        else if (/^(01234567|12345678|23456789|34567890|87654321|76543210|65432109|54321098|43210987|32109876|21098765|10987654)/.test(phoneValue)) {
          phoneError = 'Teléfono inválido. No puede ser una secuencia consecutiva';
        }
      }
    }
    
    // Actualizar error inmediatamente para validaciones de formato
    setErrors(prev => ({
      ...prev,
      phone: phoneError
    }));
    
    // Validación de unicidad con debounce (solo si formato es válido)
    if (!phoneError && filteredText.length >= 8 && filteredText.length <= 12) {
      const timeout = setTimeout(async () => {
        try {
          // Crear número completo con +54 para verificar unicidad
          const fullPhoneNumber = `+54 ${filteredText}`;
          const isUnique = await checkPhoneUniqueness(fullPhoneNumber);
          if (!isUnique) {
            setErrors(prev => ({
              ...prev,
              phone: 'Este teléfono ya está registrado por otro usuario'
            }));
          }
        } catch (error) {
          console.log('Error verificando unicidad del teléfono en tiempo real:', error);
        }
      }, 1000); // Esperar 1 segundo después de que el usuario deje de escribir
      
      phoneValidationTimeout.current = timeout;
    }
  }, [currentUserId]);

  // useEffect para obtener datos del usuario autenticado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchUserData(user);
      } else {
        navigation.replace('Login');
      }
    });

    // Cleanup function
    return () => {
      unsubscribe();
      // Limpiar timeouts si existen
      if (dniValidationTimeout.current) {
        clearTimeout(dniValidationTimeout.current);
      }
      if (phoneValidationTimeout.current) {
        clearTimeout(phoneValidationTimeout.current);
      }
    };
  }, [dniValidationTimeout, phoneValidationTimeout]);

  // useEffect para hacer scroll hacia arriba cuando se inicia la edición
  useEffect(() => {
    if (isEditing && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 100);
    }
  }, [isEditing]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
        bounces={true}
        alwaysBounceVertical={true}
        contentInsetAdjustmentBehavior="automatic"
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
            maxLength={20}
          />
          
          <DataField
            icon="user"
            label="Apellido"
            value={isEditing ? editLastName : userData.lastName}
            isEditable={true}
            isEditing={isEditing}
            onChangeText={handleLastNameChange}
            error={errors.lastName}
            maxLength={20}
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
            prefix="+54"
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
                style={[styles.saveButton, !hasChanges() && styles.saveButtonDisabled]}
                onPress={handleSaveChanges}
                activeOpacity={hasChanges() ? 0.8 : 1}
                disabled={!hasChanges()}
              >
                <FontAwesome name="check" size={18} color="#fff" />
                <Text style={[styles.saveButtonText, !hasChanges() && styles.saveButtonTextDisabled]}>Guardar</Text>
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

        {/* Botón para volver al perfil */}
        {!isEditing && (
          <View style={styles.backSection}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackToProfile}
              activeOpacity={0.8}
            >
              <FontAwesome name="arrow-left" size={18} color="#8F08AA" />
              <Text style={styles.backButtonText}>Volver a Perfil</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Espaciado inferior para mejor scroll */}
        <View style={{ height: 120 }} />
        
      </ScrollView>
      
      {/* --- MODAL DE ALERTA/CONFIRMACIÓN PERSONALIZADO --- */}
      <CustomAlertModal
        isVisible={customAlertData.isVisible}
        title={customAlertData.title}
        message={customAlertData.message}
        onConfirm={customAlertData.onConfirm}
        onCancel={customAlertData.onCancel}
        confirmText={customAlertData.confirmText}
        type={customAlertData.type}
      />
      
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
    paddingBottom: 120,
    paddingTop: 10,
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
  inputWithPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  prefixText: {
    fontSize: 16,
    color: '#8F08AA',
    fontWeight: '600',
    paddingLeft: 12,
    paddingRight: 8,
    backgroundColor: '#f8f8f8',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
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
  inputWithPrefixText: {
    borderWidth: 0,
    borderRadius: 0,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    flex: 1,
  },
  inputError: {
    borderColor: '#B50000',
  },
  characterCounter: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
    fontStyle: 'italic',
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
  saveButtonDisabled: {
    backgroundColor: '#cccccc',
    elevation: 1,
    shadowOpacity: 0.05,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  saveButtonTextDisabled: {
    color: '#999999',
  },
  
  // Back button section
  backSection: {
    marginHorizontal: 15,
    marginTop: 15,
  },
  backButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8F08AA',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8F08AA',
    marginLeft: 8,
  },
});

// --- ESTILOS DEL MODAL DE ALERTA PERSONALIZADO ---
const alertStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalView: {
    width: '85%',
    margin: 20,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
    borderTopWidth: 5,
    borderTopColor: COLORS.primaryPurple, // Acento dinámico
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primaryPurple,
  },
  modalMessage: {
    marginBottom: 25,
    textAlign: 'center',
    fontSize: 16,
    color: COLORS.textDark,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    width: '48%',
  },
  singleButton: {
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    width: '100%',
  },
  textStyle: {
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});