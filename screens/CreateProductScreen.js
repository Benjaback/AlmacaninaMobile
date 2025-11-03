import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../src/config/firebaseConfig';
import Toast from 'react-native-toast-message';

export default function CrearProductoScreen({ navigation }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [status, setStatus] = useState('Activo');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [formValid, setFormValid] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Estado para modal de éxito
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  
  // Estados para errores (como en Login)
  const [nameError, setNameError] = useState('');
  const [priceError, setPriceError] = useState('');
  const [stockError, setStockError] = useState('');
  const [minStockError, setMinStockError] = useState('');

  // Función para validar y filtrar el nombre en tiempo real
  const checkFormValidity = (updatedValues = {}) => {
    const currentValues = {
      name: updatedValues.name !== undefined ? updatedValues.name : name,
      price: updatedValues.price !== undefined ? updatedValues.price : price,
      stock: updatedValues.stock !== undefined ? updatedValues.stock : stock,
      minStock: updatedValues.minStock !== undefined ? updatedValues.minStock : minStock,
      category: updatedValues.category !== undefined ? updatedValues.category : category,
      status: updatedValues.status !== undefined ? updatedValues.status : status,
    };

    const isValid = 
      currentValues.name.trim() !== '' &&
      currentValues.price?.toString().trim() !== '' &&
      currentValues.stock?.toString().trim() !== '' &&
      currentValues.minStock?.toString().trim() !== '' &&
      currentValues.category !== '' &&
      currentValues.status !== '';

    // Verificar si hay cambios
    const hasChanges = 
      currentValues.name.trim() !== '' ||
      currentValues.price?.toString().trim() !== '' ||
      currentValues.stock?.toString().trim() !== '' ||
      currentValues.minStock?.toString().trim() !== '' ||
      currentValues.category !== '' ||
      currentValues.status !== 'Activo' ||
      currentValues.description !== '';

    setFormValid(isValid);
    setHasChanges(hasChanges);
  };

  const handleNameChange = (text) => {
    // Permitir solo letras, espacios y acentos
    const filteredText = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    setName(filteredText);
    checkFormValidity({ name: filteredText });
  };

  // Función para validar y filtrar el stock en tiempo real
  const handleStockChange = (text) => {
    // Permitir solo números enteros (sin puntos ni comas)
    const filteredText = text.replace(/[^0-9]/g, '');
    setStock(filteredText);
    checkFormValidity({ stock: filteredText });
  };

  // Función para validar y filtrar el stock mínimo en tiempo real
  const handleMinStockChange = (text) => {
    // Permitir solo números enteros (sin puntos ni comas)
    const filteredText = text.replace(/[^0-9]/g, '');
    setMinStock(filteredText);
    checkFormValidity({ minStock: filteredText });
  };

  const handleSelectImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    // Limpiar errores anteriores
    setNameError('');
    setPriceError('');
    setStockError('');
    setMinStockError('');

    // Validación de campos obligatorios
    if (!name || !price || !stock) {
      Toast.show({
        type: 'error',
        text1: 'Campos incompletos',
        text2: 'Por favor completá los campos requeridos.',
      });
      return;
    }

    // Validación del nombre del producto (solo letras y espacios)
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!nameRegex.test(name.trim())) {
      const error = new Error('Invalid name');
      error.code = 'INVALID_NAME';
      
      switch (error.code) {
        case 'INVALID_NAME':
          setNameError('El nombre del producto solo puede contener letras y espacios.');
          break;
        default:
          setNameError('Nombre inválido');
          break;
      }
      return;
    }

    // Validación de números
    if (price === '' || isNaN(price) || parseFloat(price) <= 0) {
      // Crear error con código específico según el tipo de problema
      const error = new Error('Invalid price value');
      
      if (price === '' || isNaN(price)) {
        error.code = 'PRICE_NOT_NUMBER';
      } else if (parseFloat(price) <= 0) {
        error.code = 'PRICE_ZERO_OR_NEGATIVE';
      } else {
        error.code = 'INVALID_PRICE';
      }
      
      switch (error.code) {
        case 'PRICE_NOT_NUMBER':
          setPriceError('El precio debe ser un número');
          break;
        case 'PRICE_ZERO_OR_NEGATIVE':
          setPriceError('El precio debe ser mayor a 0');
          break;
        case 'INVALID_PRICE':
          setPriceError('Precio inválido');
          break;
        default:
          setPriceError('Error en el precio');
          break;
      }
      return;
    }

    if (stock === '' || isNaN(stock) || parseInt(stock) < 0) {
      // Crear error con código específico según el tipo de problema
      const error = new Error('Invalid stock value');
      
      if (stock === '' || isNaN(stock)) {
        error.code = 'STOCK_NOT_NUMBER';
      } else if (parseInt(stock) < 0) {
        error.code = 'STOCK_NEGATIVE';
      } else {
        error.code = 'INVALID_STOCK';
      }
      
      switch (error.code) {
        case 'STOCK_NOT_NUMBER':
          setStockError('El stock debe ser un número');
          break;
        case 'STOCK_NEGATIVE':
          setStockError('El stock debe ser mayor o igual a 0');
          break;
        case 'INVALID_STOCK':
          setStockError('Stock inválido');
          break;
        default:
          setStockError('Error en el stock');
          break;
      }
      return;
    }

    // Validación de stock mínimo (opcional, pero si se ingresa debe ser válido)
    if (minStock && (isNaN(minStock) || parseInt(minStock) < 0)) {
      const error = new Error('Invalid minStock value');
      
      if (isNaN(minStock)) {
        error.code = 'MINSTOCK_NOT_NUMBER';
      } else if (parseInt(minStock) < 0) {
        error.code = 'MINSTOCK_NEGATIVE';
      } else {
        error.code = 'INVALID_MINSTOCK';
      }
      
      switch (error.code) {
        case 'MINSTOCK_NOT_NUMBER':
          setMinStockError('El stock mínimo debe ser un número');
          break;
        case 'MINSTOCK_NEGATIVE':
          setMinStockError('El stock mínimo debe ser mayor o igual a 0');
          break;
        case 'INVALID_MINSTOCK':
          setMinStockError('Stock mínimo inválido');
          break;
        default:
          setMinStockError('Error en el stock mínimo');
          break;
      }
      return;
    }

    // Validación: stock mínimo no puede ser mayor al stock actual
    if (minStock && parseInt(minStock) > parseInt(stock)) {
      setMinStockError('El stock mínimo no puede ser mayor al stock actual');
      return;
    }

    setLoading(true);

    try {
      // Crear objeto producto (sin imagen por ahora)
      const nuevoProducto = {
        name: name.trim(),
        price: parseFloat(price),
        stock: parseInt(stock),
        minStock: minStock ? parseInt(minStock) : null,
        status,
        category: category || null,
        description: description.trim(),
        imageUri: imageUri || null, // Guardar URI local por ahora
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Guardar en Firestore
      console.log('Guardando producto en Firestore...');
      const docRef = await addDoc(collection(db, 'products'), nuevoProducto);
      console.log('Producto guardado con ID:', docRef.id);

      // Limpiar errores al guardar exitosamente
      setNameError('');
      setPriceError('');
      setStockError('');
      setMinStockError('');

      // Limpiar formulario
      setName('');
      setPrice('');
      setStock('');
      setMinStock('');
      setDescription('');
      setImageUri(null);
      setStatus('Activo');
      setCategory('');

      // Mostrar modal de éxito
      setSuccessModalVisible(true);
      
      // Volver atrás después de un delay
      setTimeout(() => {
        setSuccessModalVisible(false);
        navigation.goBack();
      }, 3000);

    } catch (error) {
      console.error('Error guardando producto:', error);
      Toast.show({
        type: 'error',
        text1: '❌ Error al guardar',
        text2: 'No se pudo guardar el producto. Inténtalo de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={true}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleCancel}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.title}>CREAR PRODUCTO</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Card Container */}
          <View style={styles.card}>
            {/* Category Icons */}
            <View style={styles.categoryContainer}>
              <TouchableOpacity
                style={[styles.categoryButton, category === 'Canes' && styles.categoryButtonActive]}
                onPress={() => {
                  setCategory('Canes');
                  checkFormValidity({ category: 'Canes' });
                }}
              >
                <FontAwesome5 name="dog" size={24} color={category === 'Canes' ? '#fff' : '#9C27B0'} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.categoryButton, category === 'Felinos' && styles.categoryButtonActive]}
                onPress={() => setCategory('Felinos')}
              >
                <FontAwesome5 name="cat" size={24} color={category === 'Felinos' ? '#fff' : '#9C27B0'} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.categoryButton, category === 'Peces' && styles.categoryButtonActive]}
                onPress={() => setCategory('Peces')}
              >
                <FontAwesome5 name="fish" size={24} color={category === 'Peces' ? '#fff' : '#9C27B0'} />
              </TouchableOpacity>
            </View>

            {/* Nombre del Producto */}
            <Text style={styles.label}>Nombre del Producto <Text style={styles.asterisk}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Pedigree"
              value={name}
              onChangeText={handleNameChange}
              maxLength={30}
            />
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

            {/* Precio */}
             <Text style={styles.label}>Precio <Text style={styles.asterisk}>*</Text></Text>
                  <TextInput
                    style={styles.input}
                    placeholder="$ 0"
                    keyboardType="numeric"
                    value={price}
                    onChangeText={(text) => {
                        // Filtrar signos negativos y solo permitir números y punto decimal
                        const filteredText = text.replace(/[^0-9.]/g, '');
                        
                        // Permitir solo un punto decimal
                        const parts = filteredText.split('.');
                        const cleanText = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : filteredText;
                        
                        setPrice(cleanText);
                        checkFormValidity({ price: cleanText });
                      }}
                        maxLength={10}
                />
              {priceError ? <Text style={styles.errorText}>{priceError}</Text> : null}

            {/* Stock y Stock Mínimo */}
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Stock <Text style={styles.asterisk}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  keyboardType="numeric"
                  value={stock}
                  onChangeText={handleStockChange}
                  maxLength={10}
                />
                {stockError ? <Text style={styles.errorText}>{stockError}</Text> : null}
              </View>

              <View style={styles.halfInput}>
                <Text style={styles.label}>Stock Mínimo <Text style={styles.asterisk}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  keyboardType="numeric"
                  value={minStock}
                  onChangeText={handleMinStockChange}
                  maxLength={10}
                />
                {minStockError ? <Text style={styles.errorText}>{minStockError}</Text> : null}
              </View>
            </View>

            {/* Estado */}
            <Text style={styles.label}>Estado <Text style={styles.asterisk}>*</Text></Text>
            <View style={styles.statusContainer}>
              <TouchableOpacity
                style={[styles.statusButton, status === 'Activo' && styles.statusButtonActive]}
                onPress={() => {
                  setStatus('Activo');
                  checkFormValidity({ status: 'Activo' });
                }}
              >
                <Text style={[styles.statusButtonText, status === 'Activo' && styles.statusButtonTextActive]}>
                  Activo
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.statusButton, status === 'Inactivo' && styles.statusButtonActive]}
                onPress={() => setStatus('Inactivo')}
              >
                <Text style={[styles.statusButtonText, status === 'Inactivo' && styles.statusButtonTextActive]}>
                  Inactivo
                </Text>
              </TouchableOpacity>
            </View>

            {/* Descripción */}
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ej: Bolsa de 15 kg , botella 1,5 L"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            {/* Imagen del Producto */}
            <Text style={styles.label}>Imagen del Producto</Text>
            <TouchableOpacity style={styles.imageButton} onPress={handleSelectImage}>
              <Text style={styles.imageButtonText}>
                Seleccionar Archivo
              </Text>
              <Text style={styles.imageButtonSubtext}>
                {imageUri ? '1 archivo seleccionado' : 'Ningún archivo seleccionado'}
              </Text>
            </TouchableOpacity>

            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            )}

            {/* Botones de Acción */}
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.createButton, (loading || !formValid || !hasChanges) && styles.createButtonDisabled]} 
                onPress={handleSave}
                disabled={loading || !formValid || !hasChanges}
              >
                <Text style={styles.createButtonText}>
                  {loading ? 'CREANDO...' : 'CREAR'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>CANCELAR</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Espaciado adicional para mejor scroll */}
          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal
        visible={successModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            {/* Animal Icon Animation */}
            <View style={[styles.successIconContainer, styles.animalIconContainer]}>
              {category === 'Canes' && (
                <FontAwesome5 
                  name="dog" 
                  size={60} 
                  color="#9C27B0"
                  style={styles.animalIcon} 
                />
              )}
              {category === 'Felinos' && (
                <FontAwesome5 
                  name="cat" 
                  size={60} 
                  color="#9C27B0"
                  style={styles.animalIcon} 
                />
              )}
              {category === 'Peces' && (
                <FontAwesome5 
                  name="fish" 
                  size={60} 
                  color="#9C27B0"
                  style={styles.animalIcon} 
                />
              )}
              <View style={styles.checkmarkOverlay}>
                <Ionicons name="checkmark-circle" size={30} color="#4CAF50" />
              </View>
            </View>
            
            {/* Title */}
            <Text style={styles.successModalTitle}>¡Producto Creado!</Text>
            
            {/* Message */}
            <Text style={styles.successModalText}>
              El producto se guardó correctamente en el inventario
            </Text>
          </View>
        </View>
      </Modal>

      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { 
    flexGrow: 1,
    backgroundColor: '#fff',
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 40,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#9C27B0',
    margin: 20,
    marginTop: 10,
    padding: 20,
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  categoryButton: {
    width: 70,
    height: 50,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9C27B0',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#9C27B0',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#9C27B0',
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statusButton: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#9C27B0',
    paddingVertical: 12,
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#9C27B0',
  },
  statusButtonText: {
    fontSize: 14,
    color: '#9C27B0',
    fontWeight: 'bold',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  imageButton: {
    backgroundColor: '#fff',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#9C27B0',
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imageButtonText: {
    fontSize: 14,
    color: '#666',
  },
  imageButtonSubtext: {
    fontSize: 12,
    color: '#999',
  },
  imagePreview: {
    width: '100%',
    height: 150,
    borderRadius: 15,
    marginTop: 15,
    resizeMode: 'cover',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
  },
  createButton: {
    backgroundColor: '#9C27B0',
    padding: 15,
    borderRadius: 25,
    width: '48%',
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#D3D3D3',
    opacity: 0.7,
  },
  createButtonText: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#FF0000',
    padding: 15,
    borderRadius: 25,
    width: '48%',
    alignItems: 'center',
  },
  cancelButtonText: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: 'bold',
  },
  errorText: {
    color: '#B50000',
    fontSize: 11,
    marginTop: 4,
    marginBottom: 4,
    marginLeft: 15,
  },
  // Success Modal Styles
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    width: '80%',
    maxWidth: 350,
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 15,
    position: 'relative',
  },
  animalIconContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animalIcon: {
    transform: [{ scale: 1.2 }],
    textShadowColor: 'rgba(156, 39, 176, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  checkmarkOverlay: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 2,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  successModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  successModalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  successButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    minWidth: 150,
    alignItems: 'center',
  },
  successButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  asterisk: {
    color: '#FF0000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});