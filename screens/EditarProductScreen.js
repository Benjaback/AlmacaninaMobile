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

    export default function EditarProductoScreen({ route, navigation }) {
    const { producto } = route.params;

    const [name, setName] = useState(producto.name);
    const [price, setPrice] = useState(producto.price);
    const [stock, setStock] = useState(producto.stock.toString());
    const [minStock, setMinStock] = useState(producto.minStock?.toString() || '');
    const [provider, setProvider] = useState(producto.provider || '');
    const [category, setCategory] = useState(producto.category || '');
    const [status, setStatus] = useState(producto.status);
    const [description, setDescription] = useState(producto.description || '');
    const [imageUri, setImageUri] = useState(producto.image || null);

    const handleUpdate = () => {
        Alert.alert('Producto actualizado', `Se actualizó: ${name}`);
        navigation.goBack();
    };

    const handleCancel = () => {
        Alert.alert('Edición cancelada', 'No se realizaron cambios.');
        navigation.goBack();
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

    return (
        <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>EDITAR PRODUCTO</Text>

        {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        ) : (
            <Text style={styles.noImage}>Sin imagen cargada</Text>
        )}

        <TouchableOpacity style={styles.imageButton} onPress={handleSelectImage}>
            <Text style={styles.imageButtonText}>Cambiar Imagen</Text>
        </TouchableOpacity>

        <TextInput
            style={styles.input}
            placeholder="Nombre del Producto"
            value={name}
            onChangeText={setName}
        />

        <TextInput
            style={styles.input}
            placeholder="Precio ($)"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
        />

        <TextInput
            style={styles.input}
            placeholder="Stock"
            keyboardType="numeric"
            value={stock}
            onChangeText={setStock}
        />

        <TextInput
            style={styles.input}
            placeholder="Stock Mínimo"
            keyboardType="numeric"
            value={minStock}
            onChangeText={setMinStock}
        />
{/* 
        <TextInput
            style={styles.input}
            placeholder="Proveedor"
            keyboardType='text'
            value={provider}
            onChangeText={setProvider}
        /> */}

        <View style={styles.pickerContainer}>
            <Picker
            selectedValue={category}
            onValueChange={(itemValue) => setCategory(itemValue)}
            >
            <Picker.Item label="Seleccione una Categoría" value="" />
            <Picker.Item label="Perros" value="Perros" />
            <Picker.Item label="Gatos" value="Gatos" />
            <Picker.Item label="Peces" value="Peces" />
            </Picker>
        </View>

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
            <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
            <Text style={styles.buttonText}>ACTUALIZAR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.buttonText}>CANCELAR</Text>
            </TouchableOpacity>
        </View>
        </ScrollView>
    );
    }

    const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: '#fff' },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#6A1B9A',
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
    updateButton: {
        backgroundColor: '#6A1B9A',
        padding: 12,
        borderRadius: 8,
        width: '48%',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#D32F2F',
        padding: 12,
        borderRadius: 8,
        width: '48%',
        alignItems: 'center',
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    });
