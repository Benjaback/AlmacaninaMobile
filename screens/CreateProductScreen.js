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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
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
  
  // Estados para errores (como en Login)
  const [nameError, setNameError] = useState('');
  const [priceError, setPriceError] = useState('');
  const [stockError, setStockError] = useState('');
  const [minStockError, setMinStockError] = useState('');

  // Función para validar y filtrar el nombre en tiempo real
  const handleNameChange = (text) => {
    // Permitir solo letras, espacios y acentos
    const filteredText = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    setName(filteredText);
  };

  // Función para validar y filtrar el stock en tiempo real
  const handleStockChange = (text) => {
    // Permitir solo números enteros (sin puntos ni comas)
    const filteredText = text.replace(/[^0-9]/g, '');
    setStock(filteredText);
  };

  // Función para validar y filtrar el stock mínimo en tiempo real
  const handleMinStockChange = (text) => {
    // Permitir solo números enteros (sin puntos ni comas)
    const filteredText = text.replace(/[^0-9]/g, '');
    setMinStock(filteredText);
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

      // Éxito
      Toast.show({
        type: 'success',
        text1: 'Producto creado',
        text2: `${name} se agregó correctamente`,
        props: {
          style: { backgroundColor: '#8F08AA' }
        }
      });

      // Limpiar formulario
      setName('');
      setPrice('');
      setStock('');
      setMinStock('');
      setDescription('');
      setImageUri(null);
      setStatus('Activo');
      
      // Volver atrás después de un delay para que se vea el toast
      setTimeout(() => {
        navigation.goBack();
      }, 1500);

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
      <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>CREAR PRODUCTO</Text>

      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.imagePreview} />
      ) : (
        <Text style={styles.noImage}>Sin imagen cargada</Text>
      )}

      <TouchableOpacity style={styles.imageButton} onPress={handleSelectImage}>
        <Text style={styles.imageButtonText}>Seleccionar Imagen</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Nombre del Producto"
        value={name}
        onChangeText={handleNameChange}
        maxLength={50}
      />
      {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Precio"
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
      />
      {priceError ? <Text style={styles.errorText}>{priceError}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Stock"
        keyboardType="numeric"
        value={stock}
        onChangeText={handleStockChange}
        maxLength={10}
      />
      {stockError ? <Text style={styles.errorText}>{stockError}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Stock Mínimo"
        keyboardType="numeric"
        value={minStock}
        onChangeText={handleMinStockChange}
        maxLength={10}
      />
      {minStockError ? <Text style={styles.errorText}>{minStockError}</Text> : null}

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={status}
          onValueChange={(itemValue) => setStatus(itemValue)}
        >
          <Picker.Item label="Activo" value="Activo" />
          <Picker.Item label="Inactivo" value="Inactivo" />
        </Picker>
      </View>

      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Descripción"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'GUARDANDO...' : 'GUARDAR'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.buttonText}>CANCELAR</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#6A1B9A',
    marginTop: 30,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f3f3f3',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  pickerContainer: {
    backgroundColor: '#f3f3f3',
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
  },
  imageButton: {
    backgroundColor: '#6A1B9A',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  imageButtonText: { color: '#fff', fontSize: 16 },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  noImage: {
    fontSize: 14,
    color: '#999',
    marginBottom: 10,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#6A1B9A',
    padding: 12,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#D3D3D3',
    opacity: 0.7,
  },
  cancelButton: {
    backgroundColor: '#D32F2F',
    padding: 12,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  errorText: {
    color: '#B50000',
    fontSize: 12,
    marginTop: -15,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
});
