import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

// ✅ Activar animaciones en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ProductScreen({ navigation, route }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOption, setFilterOption] = useState('Todos');
  const [products, setProducts] = useState([]);

  // ✅ Agregar producto nuevo con animación
  useEffect(() => {
    if (route.params?.nuevoProducto) {
      const nuevo = route.params.nuevoProducto;
      if (!products.find(p => p.id === nuevo.id)) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setProducts([nuevo, ...products]);
        navigation.setParams({ nuevoProducto: null });
      }
    }
  }, [route.params?.nuevoProducto]);

  const handleAddProduct = () => {
    navigation.navigate('CrearProducto');
  };

  const handleEdit = (id) => {
    const product = products.find((p) => p.id === id);
    if (product) {
      navigation.navigate('EditarProducto', { producto: product });
    } else {
      Alert.alert('Error', 'Producto no encontrado');
    }
  };

  const handleDelete = (id) => {
    const product = products.find((p) => p.id === id);
    Alert.alert(
      'Confirmar eliminación',
      `¿Desea borrar el producto "${product.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            const updated = products.filter((p) => p.id !== id);
            setProducts(updated);
          },
        },
      ]
    );
  };

  const filteredProducts = products
    .filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        filterOption === 'Todos' ||
        (filterOption === 'Activo' && item.status === 'Activo') ||
        (filterOption === 'Inactivo' && item.status === 'Inactivo') ||
        (filterOption === 'Stock bajo' && item.stock <= 5) ||
        filterOption === 'Estado';
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (filterOption === 'A-Z') return a.name.localeCompare(b.name);
      if (filterOption === 'Z-A') return b.name.localeCompare(a.name);
      return 0;
    });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Productos</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Buscar productos..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <Picker
        selectedValue={filterOption}
        onValueChange={(itemValue) => setFilterOption(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Todos" value="Todos" />
        <Picker.Item label="A-Z" value="A-Z" />
        <Picker.Item label="Z-A" value="Z-A" />
        <Picker.Item label="Stock bajo" value="Stock bajo" />
        <Picker.Item label="Estado" value="Estado" />
        <Picker.Item label="Activo" value="Activo" />
        <Picker.Item label="Inactivo" value="Inactivo" />
      </Picker>

      {filteredProducts.length === 0 ? (
        <Text style={styles.emptyMessage}>No hay productos cargados.</Text>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.productImage} />
              ) : (
                <Ionicons name="image" size={40} color="#ccc" />
              )}
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>{item.price}</Text>
              <Text style={styles.productStatus}>Estado: {item.status}</Text>
              <Text style={[styles.productStock, item.stock <= 5 && styles.lowStock]}>
                Stock: {item.stock}
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleEdit(item.id)}>
                  <Ionicons name="pencil" size={20} color="#4CAF50" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginLeft: 10 }}>
                  <Ionicons name="trash" size={20} color="#F44336" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity style={styles.floatingButton} onPress={handleAddProduct}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  searchInput: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  picker: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 20,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  productCard: {
    backgroundColor: '#fff',
    borderColor: '#9C27B0',
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 10,
    width: '48%',
    marginHorizontal: '1%',
    alignItems: 'center',
    elevation: 3,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A148C',
    textAlign: 'center',
  },
  productPrice: {
    fontSize: 14,
    color: '#666',
  },
  productStatus: {
    fontSize: 13,
    color: '#888',
  },
  productStock: {
    fontSize: 13,
    color: '#888',
  },
  lowStock: {
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    backgroundColor: '#9C27B0',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  emptyMessage: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 40,
  },
});
