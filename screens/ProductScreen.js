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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../src/config/firebaseConfig';

// ✅ Activar animaciones en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ProductScreen({ navigation, route }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterOption, setFilterOption] = useState('Todos');
  const [tempFilterOption, setTempFilterOption] = useState('Todos');
  const [products, setProducts] = useState([]);

  // ✅ Suscripción en tiempo real a Firestore
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const items = [];
        querySnapshot.forEach((d) => {
          const data = d.data();
          items.push({
            id: d.id,
            name: data.name || '',
            price: data.price ?? '',
            stock: data.stock ?? 0,
            minStock: data.minStock ?? null, // ✅ AGREGADO
            status: data.status || '',
            category: data.category || '', // ✅ AGREGADO
            description: data.description || '',
            image: data.imageUri || data.image || null,
          });
        });
        setProducts(items);
      },
      (error) => {
        console.error('Error fetching products:', error);
        Alert.alert('Error', 'No se pudieron cargar los productos.');
      }
    );

    return () => unsubscribe();
  }, []);

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
      `¿Desea borrar el producto "${product ? product.name : id}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              await deleteDoc(doc(db, 'products', id));
            } catch (error) {
              console.error('Error eliminando producto:', error);
              Alert.alert('Error', 'No se pudo eliminar el producto.');
            }
          },
        },
      ]
    );
  };

  // ✅ Filtro + ordenamiento
  const filteredProducts = products
    .filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        filterOption === 'Todos' ||
        filterOption === 'A-Z' ||
        filterOption === 'Z-A' ||
        (filterOption === 'Canes' && item.category === 'Canes') ||
        (filterOption === 'Peces' && item.category === 'Peces') ||
        (filterOption === 'Felinos' && item.category === 'Felinos') ||
        (filterOption === 'Stock Bajo' && item.stock <= 5);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (filterOption === 'A-Z') return a.name.localeCompare(b.name);
      if (filterOption === 'Z-A') return b.name.localeCompare(a.name);
      return 0;
    });

  const handleApplyFilter = () => {
    setFilterOption(tempFilterOption);
    setFilterModalVisible(false);
  };

  const handleClearFilter = () => {
    setTempFilterOption('Todos');
    setFilterOption('Todos');
    setFilterModalVisible(false);
  };

  const handleOpenFilter = () => {
    setTempFilterOption(filterOption);
    setFilterModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>PRODUCTO</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search-outline" size={20} color="#9C27B0" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar Productos"
            placeholderTextColor="#9C27B0"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={handleOpenFilter}
        >
          <Ionicons name="filter-outline" size={24} color="#9C27B0" />
        </TouchableOpacity>
      </View>

      {/* Products Grid */}
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
              {/* Delete button - top left */}
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id)}
              >
                <Ionicons name="close" size={20} color="#9C27B0" />
              </TouchableOpacity>

              {/* Edit button - top right */}
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => handleEdit(item.id)}
              >
                <Ionicons name="pencil" size={20} color="#9C27B0" />
              </TouchableOpacity>

              {/* Product Image */}
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.productImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="image-outline" size={50} color="#ccc" />
                </View>
              )}

              {/* Product Name */}
              <Text style={styles.productName}>{item.name}</Text>

              {/* Price */}
              <Text style={styles.productPrice}>${item.price}</Text>

              {/* Stock */}
              <Text style={styles.productStock}>
                ($ {(item.stock * 1000).toLocaleString()} x Kg)
              </Text>

              {/* Availability */}
              <Text style={[
                styles.productAvailability,
                item.stock <= 5 && styles.lowStockText
              ]}>
                Disponibilidad: {item.stock}
              </Text>

              {/* Status Button */}
              <TouchableOpacity 
                style={[
                  styles.statusButton,
                  item.status === 'Activo' ? styles.activeButton : styles.inactiveButton
                ]}
              >
                <Text style={styles.statusButtonText}>
                  {item.status === 'Activo' ? 'Activo' : 'Inactivo'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.floatingButton} onPress={handleAddProduct}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Filtrar por categoría</Text>
            
            {/* Ordenar Section */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Ordenar</Text>
              <View style={styles.filterRow}>
                <TouchableOpacity
                  style={[
                    styles.filterOptionButton,
                    tempFilterOption === 'A-Z' && styles.filterOptionButtonSelected
                  ]}
                  onPress={() => setTempFilterOption('A-Z')}
                >
                  <Text style={[
                    styles.filterOptionButtonText,
                    tempFilterOption === 'A-Z' && styles.filterOptionButtonTextSelected
                  ]}>
                    Nombre A-Z
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOptionButton,
                    tempFilterOption === 'Z-A' && styles.filterOptionButtonSelected
                  ]}
                  onPress={() => setTempFilterOption('Z-A')}
                >
                  <Text style={[
                    styles.filterOptionButtonText,
                    tempFilterOption === 'Z-A' && styles.filterOptionButtonTextSelected
                  ]}>
                    Nombre Z-A
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Categories Section */}
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[
                  styles.filterCategoryButton,
                  tempFilterOption === 'Canes' && styles.filterOptionButtonSelected
                ]}
                onPress={() => setTempFilterOption('Canes')}
              >
                <Ionicons name="paw" size={20} color={tempFilterOption === 'Canes' ? '#9C27B0' : '#333'} />
                <Text style={[
                  styles.filterCategoryText,
                  tempFilterOption === 'Canes' && styles.filterOptionButtonTextSelected
                ]}>
                  Canes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterCategoryButton,
                  tempFilterOption === 'Peces' && styles.filterOptionButtonSelected
                ]}
                onPress={() => setTempFilterOption('Peces')}
              >
                <Ionicons name="fish" size={20} color={tempFilterOption === 'Peces' ? '#9C27B0' : '#333'} />
                <Text style={[
                  styles.filterCategoryText,
                  tempFilterOption === 'Peces' && styles.filterOptionButtonTextSelected
                ]}>
                  Peces
                </Text>
              </TouchableOpacity>
            </View>

            {/* Felinos Button */}
            <TouchableOpacity
              style={[
                styles.filterCategoryButtonFull,
                tempFilterOption === 'Felinos' && styles.filterOptionButtonSelected
              ]}
              onPress={() => setTempFilterOption('Felinos')}
            >
              <Ionicons name="paw" size={20} color={tempFilterOption === 'Felinos' ? '#9C27B0' : '#333'} />
              <Text style={[
                styles.filterCategoryText,
                tempFilterOption === 'Felinos' && styles.filterOptionButtonTextSelected
              ]}>
                Felinos
              </Text>
            </TouchableOpacity>

            {/* Stock Bajo Button */}
            <TouchableOpacity
              style={[
                styles.filterCategoryButtonFull,
                tempFilterOption === 'Stock Bajo' && styles.filterOptionButtonSelected
              ]}
              onPress={() => setTempFilterOption('Stock Bajo')}
            >
              <Ionicons name="cube-outline" size={20} color={tempFilterOption === 'Stock Bajo' ? '#9C27B0' : '#333'} />
              <Text style={[
                styles.filterCategoryText,
                tempFilterOption === 'Stock Bajo' && styles.filterOptionButtonTextSelected
              ]}>
                Stock Bajo
              </Text>
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.filterActionsRow}>
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={handleClearFilter}
              >
                <Ionicons name="brush-outline" size={20} color="#333" />
                <Text style={styles.clearButtonText}>Limpiar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.applyButton}
                onPress={handleApplyFilter}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.applyButtonText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: { 
    fontSize: 18, 
    fontWeight: 'bold',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#9C27B0',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  productCard: {
    backgroundColor: '#fff',
    borderColor: '#9C27B0',
    borderWidth: 2,
    borderRadius: 15,
    padding: 15,
    width: '48%',
    alignItems: 'center',
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
  },
  editButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginTop: 25,
    marginBottom: 10,
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginTop: 25,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  productStock: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  productAvailability: {
    fontSize: 11,
    color: '#666',
    marginBottom: 8,
  },
  lowStockText: {
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  statusButton: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 15,
    minWidth: 80,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#4CAF50',
  },
  inactiveButton: {
    backgroundColor: '#F44336',
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#9C27B0',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  emptyMessage: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 40,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#9C27B0',
    padding: 25,
    width: '85%',
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#000',
  },
  filterSection: {
    marginBottom: 15,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
    color: '#000',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filterOptionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#9C27B0',
    backgroundColor: '#fff',
    marginHorizontal: 5,
    alignItems: 'center',
  },
  filterOptionButtonSelected: {
    backgroundColor: '#F3E5F5',
    borderColor: '#9C27B0',
  },
  filterOptionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  filterOptionButtonTextSelected: {
    color: '#9C27B0',
  },
  filterCategoryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#9C27B0',
    backgroundColor: '#fff',
    marginHorizontal: 5,
  },
  filterCategoryButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#9C27B0',
    backgroundColor: '#fff',
    marginBottom: 12,
    alignSelf: 'center',
    minWidth: '60%',
  },
  filterCategoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  filterActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#9C27B0',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  applyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: '#9C27B0',
    marginLeft: 8,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
  },
});