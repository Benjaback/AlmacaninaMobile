import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert, // Se mantiene, pero se usa menos
    Modal,
    TextInput,
    ActivityIndicator,
    Pressable,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { onAuthStateChanged, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, db } from '../src/config/firebaseConfig';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';

// Definición de la paleta de colores (Copiada para consistencia)
const COLORS = {
    primaryPurple: '#8F08AA', // Morado Principal (ajustado al color del avatar)
    secondaryYellow: '#FFC107', // Amarillo/Dorado Principal
    textDark: '#212121',
    textLight: '#FFFFFF',
    backgroundLight: '#f5f5f5',
    cardBackground: '#FFFFFF', // Blanco para las tarjetas
    shadowColor: '#000000',
    buttonText: '#FFFFFF',
    lowStockRed: '#D32F2F',
    safeStockGreen: '#4CAF50',
};

// --- 1. COMPONENTE MODAL DE ALERTA PERSONALIZADO (GENERALIZADO) ---
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

// --- 2. NUEVO COMPONENTE MODAL PARA SELECCIÓN DE IMAGEN ---
const ImageActionModal = ({ isVisible, onClose, onCamera, onGallery }) => {
    const { primaryPurple, secondaryYellow, textLight, textDark, cardBackground } = COLORS;

    if (!isVisible) return null;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <Pressable style={imageActionStyles.centeredView} onPress={onClose}>
                <View style={imageActionStyles.modalView}>
                    <Text style={imageActionStyles.title}>Actualizar Foto de Perfil</Text>
                    <Text style={imageActionStyles.subtitle}>Selecciona una opción:</Text>
                    
                    <View style={imageActionStyles.actionContainer}>
                        
                        <TouchableOpacity style={imageActionStyles.actionButton} onPress={onCamera}>
                            <MaterialIcons name="camera-alt" size={24} color={textLight} />
                            <Text style={imageActionStyles.actionText}>Abrir Cámara</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={imageActionStyles.actionButton} onPress={onGallery}>
                            <MaterialIcons name="photo-library" size={24} color={textLight} />
                            <Text style={imageActionStyles.actionText}>Elegir de Galería</Text>
                        </TouchableOpacity>

                        {/* Botón de Cancelar con color Amarillo/Dorado */}
                        <TouchableOpacity 
                            style={[
                                imageActionStyles.cancelButton, 
                                { backgroundColor: secondaryYellow } // <--- DETALLE AMARILLO/DORADO
                            ]} 
                            onPress={onClose}
                        >
                            <Text style={[imageActionStyles.cancelText, { color: textDark }]}>
                                Cancelar
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Pressable>
        </Modal>
    );
};
// --- FIN NUEVO COMPONENTE MODAL PARA SELECCIÓN DE IMAGEN ---


export default function PantallaPerfil({ navigation }) {
    // ... (Estados de usuario y contraseña)
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userInitials, setUserInitials] = useState('U');
    const [loading, setLoading] = useState(true);
    const [userImage, setUserImage] = useState(null);
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [changeLoading, setChangeLoading] = useState(false);
    const [passwordLength, setPasswordLength] = useState(false);
    const [hasUppercase, setHasUppercase] = useState(false);
    const [hasLowercase, setHasLowercase] = useState(false);
    const [hasNumber, setHasNumber] = useState(false);
    const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
    
    // ESTADO PARA EL MODAL DE ACCIONES DE IMAGEN (NUEVO)
    const [isImageActionModalVisible, setIsImageActionModalVisible] = useState(false);

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

    // Función para generar iniciales del nombre (sin cambios)
    const getInitials = (name) => {
        if (!name || name.trim() === '') return 'U';
        const names = name.trim().split(' ').filter(n => n.length > 0);
        if (names.length === 1) {
            return names[0].charAt(0).toUpperCase();
        }
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    };

    // Función para guardar imagen en Firestore (sin cambios)
    const saveImageToFirestore = async (imageUri) => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                profileImage: imageUri,
                updatedAt: new Date().toISOString()
            });

            Toast.show({
                type: 'success',
                text1: 'Foto actualizada',
                text2: 'Tu foto de perfil se guardó correctamente',
                visibilityTime: 3000,
            });

        } catch (error) {
            console.error('Error guardando imagen:', error);
            Toast.show({
                type: 'error',
                text1: 'Error al guardar',
                text2: 'No se pudo guardar la foto. Inténtalo de nuevo.',
                visibilityTime: 3000,
            });
        }
    };

    // Muestra el modal de acciones en lugar del Alert.alert
    const handleImagePicker = () => {
        setIsImageActionModalVisible(true);
    };

    // Función para abrir cámara (CERRANDO el modal de acciones)
    const openCamera = async () => {
        setIsImageActionModalVisible(false); // Cierra el modal de acciones
        try {
            const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
            
            if (cameraPermission.granted === false) {
                showCustomAlert(
                    'Permisos Requeridos',
                    'Para tomar fotos necesitamos acceso a tu cámara. Por favor, habilita los permisos en la configuración de la aplicación.',
                    () => setCustomAlertData(prev => ({ ...prev, isVisible: false })),
                    null, 
                    'ENTENDIDO',
                    'error'
                );
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled) {
                const imageUri = result.assets[0].uri;
                setUserImage(imageUri);
                await saveImageToFirestore(imageUri);
            }
        } catch (error) {
            console.error('Error al tomar foto:', error);
            showCustomAlert(
                'Error de Cámara',
                'No se pudo acceder a la cámara en este momento. Por favor, inténtalo de nuevo.',
                () => setCustomAlertData(prev => ({ ...prev, isVisible: false })),
                null, 
                'CERRAR',
                'error'
            );
        }
    };

    // abrir galería (CERRANDO el modal de acciones)
    const openGallery = async () => {
        setIsImageActionModalVisible(false); // Cierra el modal de acciones
        try {
            const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (galleryPermission.granted === false) {
                showCustomAlert(
                    'Permisos Requeridos',
                    'Para acceder a tus fotos necesitamos permisos de galería. Por favor, habilita los permisos en la configuración de la aplicación.',
                    () => setCustomAlertData(prev => ({ ...prev, isVisible: false })),
                    null, 
                    'ENTENDIDO',
                    'error'
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled) {
                const imageUri = result.assets[0].uri;
                setUserImage(imageUri);
                await saveImageToFirestore(imageUri);
            }
        } catch (error) {
            console.error('Error al seleccionar imagen:', error);
            showCustomAlert(
                'Error de Galería',
                'No se pudo acceder a la galería en este momento. Por favor, inténtalo de nuevo.',
                () => setCustomAlertData(prev => ({ ...prev, isVisible: false })),
                null, 
                'CERRAR',
                'error'
            );
        }
    };

    // CIerre de sesion (usa CustomAlertModal - sin cambios en lógica)
    const handleLogOut = () => {
        const onConfirm = async () => {
            setCustomAlertData(prev => ({ ...prev, isVisible: false }));
            try {
                await signOut(auth);
                Toast.show({
                    type: 'success',
                    text1: 'Sesión cerrada',
                    text2: '¡Vuelve Pronto! 🐾',
                    visibilityTime: 2000,
                });
                setTimeout(() => { navigation.replace('Login'); }, 1500);
            } catch (error) {
                Toast.show({
                    type: 'error',
                    text1: 'Ups...',
                    text2: 'No pudimos cerrar la sesión. Intentá nuevamente.',
                    visibilityTime: 2500,
                });
            }
        };

        const onCancel = () => {
            setCustomAlertData(prev => ({ ...prev, isVisible: false }));
            Toast.show({
                type: 'info',
                text1: 'Tu sesión sigue activa 🐾',
                text2:'¡Nos quedamos un rato más!',
                visibilityTime: 2000,
            });
        };

        showCustomAlert(
            '¿Salir de tu Cuenta?',
            'Tu sesión actual se cerrará y podrás volver cuando lo desees.',
            onConfirm,
            onCancel,
            'SALIR',
            'default'
        );
    };

    // useEffect para obtener datos del usuario autenticado (sin cambios)
    useEffect(() => {
        let unsubscribeFirestore = null;
        
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (unsubscribeFirestore) {
                unsubscribeFirestore();
                unsubscribeFirestore = null;
            }
            
            if (user) {
                try {
                    setUserEmail(user.email || '');
                    const userDocRef = doc(db, 'users', user.uid);
                    
                    unsubscribeFirestore = onSnapshot(userDocRef, (userDoc) => {
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            const fullName = userData.fullName || 
                                             (userData.firstName && userData.lastName ? 
                                              `${userData.firstName} ${userData.lastName}` : '') || 
                                             user.displayName || '';
                            
                            if (userData.profileImage) {
                                setUserImage(userData.profileImage);
                            }
                            
                            if (fullName && fullName.trim() !== '') {
                                setUserName(fullName);
                                setUserInitials(getInitials(fullName));
                            } else {
                                const emailName = user.email.split('@')[0];
                                const formattedName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
                                setUserName(formattedName);
                                setUserInitials(getInitials(formattedName));
                            }
                        } else {
                            const displayName = user.displayName || user.email.split('@')[0];
                            const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
                            setUserName(formattedName);
                            setUserInitials(getInitials(formattedName));
                        }
                        
                        setLoading(false);
                    }, (error) => {
                        console.log('Error en listener de Firestore:', error);
                        const fallbackName = user.displayName || user.email.split('@')[0];
                        const formattedName = fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1);
                        setUserName(formattedName);
                        setUserInitials(getInitials(formattedName));
                        setLoading(false);
                    });
                    
                } catch (error) {
                    console.log('Error configurando listener:', error);
                    const fallbackName = user.displayName || user.email.split('@')[0];
                    const formattedName = fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1);
                    setUserName(formattedName);
                    setUserInitials(getInitials(formattedName));
                    setLoading(false);
                }
            } else {
                setUserName('');
                setUserEmail('');
                setUserInitials('U');
                setLoading(false);
            }
        });

        return () => {
            unsubscribe();
            if (unsubscribeFirestore) {
                unsubscribeFirestore();
            }
        };
    }, []);

    // Validación en tiempo real de la nueva contraseña
    const validatePassword = (text) => {
        setPasswordLength(text.length >= 6);
        setHasUppercase(/[A-Z]/.test(text));
        setHasLowercase(/[a-z]/.test(text));
        setHasNumber(/\d/.test(text));
    };

    // Guardar nueva contraseña: reautenticar y actualizar
    const handleSavePassword = async () => {
        const user = auth.currentUser;
        if (!user) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'No se encontró el usuario.' });
            return;
        }

        const allRequirements = passwordLength && hasUppercase && hasLowercase && hasNumber;
        if (!allRequirements) {
            Toast.show({ type: 'error', text1: 'Requisitos incompletos', text2: 'Verifica los requisitos de la nueva contraseña.' });
            return;
        }

        if (newPassword !== confirmPassword) {
            Toast.show({ type: 'error', text1: 'Coincidencia incorrecta', text2: 'Las contraseñas no coinciden.' });
            return;
        }

        if (!currentPassword || currentPassword.trim() === '') {
            Toast.show({ type: 'error', text1: 'Contraseña actual', text2: 'Ingresa tu contraseña actual para verificar.' });
            return;
        }

        setChangeLoading(true);
        try {
            const credential = EmailAuthProvider.credential(userEmail, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);

            Toast.show({ type: 'success', text1: 'Contraseña actualizada', text2: 'Tu contraseña se actualizó correctamente.' });
            // limpiar y cerrar modal
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setShowPasswordRequirements(false);
            setModalVisible(false);
        } catch (error) {
            console.error('Error updating password:', error);
            const code = error.code || '';
            if (code.includes('wrong-password')) {
                Toast.show({ type: 'error', text1: 'Contraseña incorrecta', text2: 'La contraseña actual ingresada es incorrecta.' });
            } else if (code.includes('weak-password')) {
                Toast.show({ type: 'error', text1: 'Contraseña débil', text2: 'La contraseña nueva es demasiado débil.' });
            } else if (code.includes('requires-recent-login')) {
                Toast.show({ type: 'error', text1: 'Reautenticación requerida', text2: 'Vuelve a iniciar sesión e intenta de nuevo.' });
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo actualizar la contraseña. Intenta nuevamente.' });
            }
        } finally {
            setChangeLoading(false);
        }
    };

    // esto sirve para los iconos (sin cambios)
    const MenuItem = ({ icon, title, subtitle, onPress, iconType = "FontAwesome" }) => {
        const IconComponent = iconType === "MaterialIcons" ? MaterialIcons : 
                             iconType === "Ionicons" ? Ionicons : FontAwesome;
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
                        onPress={handleImagePicker} // AHORA llama al Modal de Acciones
                        onLongPress={() => {
                            if (userImage) {
                                setImageModalVisible(true);
                            }
                        }}
                        delayLongPress={500}
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
                        onPress={() => { setModalVisible(true); }}
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

                {/* Modal para cambio de contraseña (sin cambios) */}
                <Modal
                    visible={modalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => { if (!changeLoading) setModalVisible(false); }}
                >
                    <View style={styles.modalBackdrop}>
                        <View style={styles.modalContainer}>
                            <KeyboardAwareScrollView
                                style={{ width: '100%' }}
                                contentContainerStyle={{ flexGrow: 1 }}
                                keyboardShouldPersistTaps="handled"
                                enableOnAndroid={true}
                                enableAutomaticScroll={true}
                                extraHeight={20}
                                extraScrollHeight={10}
                                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                                resetScrollToCoords={{ x: 0, y: 0 }}
                                showsVerticalScrollIndicator={false}
                            >
                                <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
                                <Text style={styles.modalText}>Ingresa tu contraseña actual y la nueva contraseña.</Text>

                                <Text style={styles.inputLabel}>Contraseña actual</Text>
                                <View style={styles.inputRow}>
                                    <TextInput
                                        value={currentPassword}
                                        onChangeText={setCurrentPassword}
                                        placeholder="Contraseña actual"
                                        secureTextEntry={!showCurrent}
                                        style={styles.inputField}
                                        editable={!changeLoading}
                                    />
                                    <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.showBtn}>
                                        <FontAwesome name={showCurrent ? 'eye-slash' : 'eye'} size={20} color="#8F08AA" />
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.inputLabel}>Nueva contraseña</Text>
                                <View style={styles.inputRow}>
                                    <TextInput
                                        value={newPassword}
                                        onChangeText={(text) => {
                                            setNewPassword(text);
                                            validatePassword(text);
                                        }}
                                        placeholder="Nueva contraseña"
                                        secureTextEntry={!showNew}
                                        style={styles.inputField}
                                        editable={!changeLoading}
                                        onFocus={() => setShowPasswordRequirements(true)}
                                        onBlur={() => setShowPasswordRequirements(false)}
                                    />
                                    <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.showBtn}>
                                        <FontAwesome name={showNew ? 'eye-slash' : 'eye'} size={20} color="#8F08AA" />
                                    </TouchableOpacity>
                                </View>

                                {showPasswordRequirements && (
                                    <View style={styles.passwordRequirements}>
                                        <View style={styles.requirementItem}>
                                            <FontAwesome name={passwordLength ? 'check-circle' : 'circle'} size={16} color={passwordLength ? '#4CAF50' : '#ccc'} />
                                            <Text style={[styles.requirementText, passwordLength && styles.requirementMet]}>Al menos 6 caracteres</Text>
                                        </View>
                                        <View style={styles.requirementItem}>
                                            <FontAwesome name={hasUppercase ? 'check-circle' : 'circle'} size={16} color={hasUppercase ? '#4CAF50' : '#ccc'} />
                                            <Text style={[styles.requirementText, hasUppercase && styles.requirementMet]}>Una letra mayúscula</Text>
                                        </View>
                                        <View style={styles.requirementItem}>
                                            <FontAwesome name={hasLowercase ? 'check-circle' : 'circle'} size={16} color={hasLowercase ? '#4CAF50' : '#ccc'} />
                                            <Text style={[styles.requirementText, hasLowercase && styles.requirementMet]}>Una letra minúscula</Text>
                                        </View>
                                        <View style={styles.requirementItem}>
                                            <FontAwesome name={hasNumber ? 'check-circle' : 'circle'} size={16} color={hasNumber ? '#4CAF50' : '#ccc'} />
                                            <Text style={[styles.requirementText, hasNumber && styles.requirementMet]}>Un número</Text>
                                        </View>
                                    </View>
                                )}

                                    <Text style={styles.inputLabel}>Confirmar nueva contraseña</Text>
                                    <View style={styles.inputRow}>
                                        <TextInput
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            placeholder="Confirmar contraseña"
                                            secureTextEntry={!showConfirm}
                                            style={[styles.inputField, { marginBottom: 10 }]}
                                            editable={!changeLoading}
                                        />
                                        <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.showBtn}>
                                            <FontAwesome name={showConfirm ? 'eye-slash' : 'eye'} size={20} color="#8F08AA" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Indicador de coincidencia */}
                                    {confirmPassword.length > 0 && (
                                        <Text style={{ fontSize: 13, color: newPassword === confirmPassword ? '#4CAF50' : '#D32F2F', marginBottom: 6 }}>
                                            {newPassword === confirmPassword ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                                        </Text>
                                    )}

                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.modalButtonSecondary]}
                                        onPress={() => { if (!changeLoading) setModalVisible(false); }}
                                        disabled={changeLoading}
                                    >
                                        <Text style={styles.modalButtonText}>Cancelar</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.modalButtonPrimary]}
                                        onPress={handleSavePassword}
                                        disabled={changeLoading || !(passwordLength && hasUppercase && hasLowercase && hasNumber && newPassword === confirmPassword)}
                                    >
                                        {changeLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalButtonText}>Guardar</Text>}
                                    </TouchableOpacity>
                                </View>
                            </KeyboardAwareScrollView>
                        </View>
                    </View>
                </Modal>

                {/* Modal para ver imagen de perfil ampliada (sin cambios) */}
                <Modal
                    visible={imageModalVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setImageModalVisible(false)}
                >
                    <View style={styles.imageModalOverlay}>
                        <TouchableOpacity 
                            style={styles.imageModalContainer}
                            activeOpacity={1}
                            onPress={() => setImageModalVisible(false)}
                        >
                            <View style={styles.imageModalContent}>
                                
                                {/* Imagen ampliada */}
                                {userImage && (
                                    <Image 
                                        source={{ uri: userImage }} 
                                        style={styles.fullImage}
                                        resizeMode="contain"
                                    />
                                )}
                                
                                {/* Información adicional */}
                                <View style={styles.imageModalInfo}>
                                    <Text style={styles.imageModalTitle}>Foto de Perfil</Text>
                                    <Text style={styles.imageModalSubtitle}>Toca para cerrar</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                </Modal>

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

                {/* --- NUEVO MODAL DE ACCIONES DE IMAGEN --- */}
                <ImageActionModal
                    isVisible={isImageActionModalVisible}
                    onClose={() => setIsImageActionModalVisible(false)}
                    onCamera={openCamera}
                    onGallery={openGallery}
                />

                {/* Espaciado inferior */}
                <View style={{ height: 30 }} />
            </ScrollView>
            <Toast />
        </SafeAreaView>
    );
}

// --- ESTILOS ADICIONALES PARA EL MODAL DE ACCIONES DE IMAGEN (ACTUALIZADOS) ---
const imageActionStyles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'flex-end', // Aparece desde abajo
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalView: {
        width: '100%',
        backgroundColor: COLORS.cardBackground,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 25,
        alignItems: 'center',
        shadowColor: COLORS.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primaryPurple,
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textDark,
        marginBottom: 20,
    },
    actionContainer: {
        width: '100%',
        alignItems: 'center',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primaryPurple,
        width: '90%',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        elevation: 2,
    },
    actionText: {
        color: COLORS.textLight,
        fontWeight: '700',
        fontSize: 16,
        marginLeft: 10,
    },
    cancelButton: {
        width: '90%',
        padding: 15,
        borderRadius: 10,
        backgroundColor: COLORS.secondaryYellow, // <--- CAMBIO AQUÍ: AMARILLO/DORADO
        marginTop: 10,
        marginBottom: 10,
        elevation: 2,
    },
    cancelText: {
        color: COLORS.textDark, // <--- CAMBIO AQUÍ: TEXTO OSCURO PARA CONTRASTE
        fontWeight: '600',
        textAlign: 'center',
        fontSize: 16,
    },
});

// --- ESTILOS DEL MODAL (alertStyles, COPIADOS DE HOME.JS Y AJUSTADOS) ---
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


const styles = StyleSheet.create({
    // ... (El resto de tus estilos para PantallaPerfil) ...
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
      // estilos modal cambio contraseña
      modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
      },
      modalContainer: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingHorizontal: 20,
        paddingVertical: 18,
        elevation: 8,
        maxHeight: '80%',
        // ensure inputs expand full width
        alignItems: 'stretch',
      },
      modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#8F08AA',
        marginBottom: 8,
        textAlign: 'center',
      },
      modalText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
        textAlign: 'center',
      },
      inputLabel: {
        fontSize: 13,
        color: '#444',
        marginTop: 6,
      },
      inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      inputField: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e6d9f4',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginTop: 6,
        marginBottom: 8,
        backgroundColor: '#fbf7ff',
        fontSize: 14,
      },
      showBtn: {
        marginLeft: 8,
        padding: 6,
      },
      showText: {
        color: '#8F08AA',
        fontSize: 12,
      },
      modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        width: '100%',
      },
      modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 6,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      modalButtonText: {
        color: '#fff',
        fontWeight: '700',
      },
      modalButtonPrimary: {
        backgroundColor: '#8F08AA',
      },
      modalButtonSecondary: {
        backgroundColor: '#6c757d',
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
      
      // Estilos para modal de imagen ampliada
      imageModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
      },
      imageModalContainer: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      },
      imageModalContent: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
      },
      fullImage: {
        width: '90%',
        height: '70%',
        borderRadius: 20,
      },
      imageModalInfo: {
        position: 'absolute',
        bottom: 80,
        alignItems: 'center',
      },
      imageModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
      },
      imageModalSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0',
      },
            passwordRequirements: {
                marginTop: 6,
                marginBottom: 6,
                paddingVertical: 6,
            },
            requirementItem: {
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 6,
            },
            requirementText: {
                marginLeft: 8,
                fontSize: 13,
                color: '#666',
            },
            requirementMet: {
                color: '#4CAF50',
            },
});