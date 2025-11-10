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
    Pressable,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../src/config/firebaseConfig';

// ✅ Activar animaciones en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COLORS = {
    primaryPurple: '#6A1B9A', // Morado Principal
    secondaryYellow: '#FFC107', // Amarillo/Dorado Principal
    lightPurple: '#F3E5F5', // Morado muy claro
    textDark: '#212121',
    textLight: '#FFFFFF',
    backgroundLight: '#EEEEEE', 
    cardBackground: '#FFFFFF', 
    shadowColor: '#000000',
    buttonText: '#FFFFFF',
    lowStockRed: '#D32F2F', 
    safeStockGreen: '#4CAF50',
    warningIcon: '#F57C00', 
};

const CustomAlertModal = ({ isVisible, title, message, onConfirm, onCancel, confirmText = 'ACEPTAR', cancelText, type = 'default' }) => {
    const { primaryPurple, secondaryYellow, textLight, textDark, lowStockRed } = COLORS;
    
    let accentColor = primaryPurple;
    let confirmBg = primaryPurple;
    let cancelBg = secondaryYellow;
    let cancelTextColor = textDark;

    if (type === 'error' || type === 'delete') {
        accentColor = lowStockRed;
        confirmBg = lowStockRed;
        cancelBg = secondaryYellow;
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
export default function ProductScreen({ navigation, route }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [filterOption, setFilterOption] = useState('Todos');
    const [tempFilterOption, setTempFilterOption] = useState('Todos');
    const [products, setProducts] = useState([]);
    
    const [customAlertData, setCustomAlertData] = useState({
        isVisible: false,
        title: '',
        message: '',
        onConfirm: () => setCustomAlertData(prev => ({ ...prev, isVisible: false })),
        onCancel: null,
        confirmText: 'ACEPTAR',
        type: 'default',
    });

    const showCustomAlert = (title, message, onConfirm, onCancel = null, confirmText = 'ACEPTAR', type = 'default', cancelText = 'CANCELAR') => {
        setCustomAlertData({
            isVisible: true,
            title,
            message,
            onConfirm,
            onCancel,
            confirmText,
            type,
            cancelText
        });
    };

    // Suscripción en tiempo real a Firestore 
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
                        minStock: data.minStock ?? null,
                        status: data.status || '',
                        category: data.category || '',
                        description: data.description || '',
                        image: data.imageUri || data.image || null,
                    });
                });
                setProducts(items);
            },
            (error) => {
                console.error('Error fetching products:', error);
                showCustomAlert(
                    'Error de Carga',
                    'No se pudieron cargar los productos. Por favor, verifica tu conexión o intenta más tarde.',
                    () => setCustomAlertData(prev => ({ ...prev, isVisible: false })),
                    null,
                    'ENTENDIDO',
                    'error'
                );
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
            showCustomAlert(
                'Producto no encontrado',
                'El producto que intentas editar no existe o ha sido eliminado.',
                () => setCustomAlertData(prev => ({ ...prev, isVisible: false })),
                null,
                'OK',
                'error'
            );
        }
    };

    const handleDelete = (id) => {
        const product = products.find((p) => p.id === id);
        const productName = product ? product.name : id;
        
        const onConfirm = async () => {
            setCustomAlertData(prev => ({ ...prev, isVisible: false })); 
            try {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                await deleteDoc(doc(db, 'products', id));
            } catch (error) {
                console.error('Error eliminando producto:', error);
                showCustomAlert(
                    'Error de Eliminación',
                    'No se pudo eliminar el producto. Inténtalo de nuevo.',
                    () => setCustomAlertData(prev => ({ ...prev, isVisible: false })),
                    null,
                    'OK',
                    'error'
                );
            }
        };

        const onCancel = () => {
            setCustomAlertData(prev => ({ ...prev, isVisible: false })); 
        };

        showCustomAlert(
            'Confirmar eliminación',
            `¿Desea borrar el producto "${productName}"? Esta acción es irreversible.`,
            onConfirm,
            onCancel,
            'ELIMINAR', 
            'delete', 
            'CANCELAR' 
        );
    };

    // ✅ Filtro + ordenamiento (Lógica sin cambios)
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

    const renderProductCard = ({ item }) => {
        const isLowStock = item.stock <= 5;
        
        return (
            <View style={styles.productCard}>
                <View style={styles.leftContent}>
                    {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.productImage} />
                    ) : (
                        <View style={styles.placeholderImage}>
                            <Ionicons name="image-outline" size={25} color={COLORS.lightPurple} />
                        </View>
                    )}
                    <View style={styles.statusAndCategory}>
                        <Text style={styles.categoryTag} numberOfLines={1}>{item.category || 'Otros'}</Text>
                        <View 
                            style={[
                                styles.statusBadge,
                                item.status === 'Activo' ? styles.activeBadge : styles.inactiveBadge
                            ]}
                        >
                            <Text style={styles.statusBadgeText}>
                                {item.status === 'Activo' ? 'Activo' : 'Inactivo'}
                            </Text>
                        </View>
                    </View>
                </View>
                <View style={styles.centerContent}>
                    <Text style={styles.productName} numberOfLines={2}>
                        {item.name}
                    </Text>
                    <View style={styles.priceStockRow}>
                        <Text style={styles.productPrice}>Precio: ${item.price}</Text>
                        </View>
                        <View style={[styles.stockBadge, isLowStock ? styles.lowStockBadge : styles.safeStockBadge]}>
                            {isLowStock && (
                                <Ionicons name="warning" size={10} color={COLORS.warningIcon} style={{ marginRight: 10 }} />
                            )}
                            <Text style={[styles.stockText, isLowStock && styles.lowStockText]}>
                                Stock: {item.stock}
                            </Text>
                        </View>
                    
                    
                </View>
                <View style={styles.rightContent}>
                    {/* Botón EDITAR */}
                    <TouchableOpacity 
                        style={styles.actionTextButton}
                        onPress={() => handleEdit(item.id)}
                    >
                        <Ionicons name="pencil-outline" size={16} color={COLORS.primaryPurple} />
                        <Text style={[styles.actionButtonText, { color: COLORS.primaryPurple }]}>
                            Editar
                        </Text>
                    </TouchableOpacity>
                    {/* Botón ELIMINAR */}
                    <TouchableOpacity 
                        style={[styles.actionTextButton, styles.deleteTextButton]}
                        onPress={() => handleDelete(item.id)}
                    >
                        <Ionicons name="trash-outline" size={16} color={COLORS.lowStockRed} />
                        <Text style={[styles.actionButtonText, { color: COLORS.lowStockRed }]}>
                            Eliminar
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.primaryPurple} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: COLORS.primaryPurple }]}>PRODUCTOS</Text>
                <View style={{ width: 24 }} />
            </View>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Ionicons name="search-outline" size={20} color={COLORS.primaryPurple} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar Productos"
                        placeholderTextColor={COLORS.primaryPurple}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <TouchableOpacity 
                    style={[styles.filterButton, { backgroundColor: COLORS.primaryPurple }]}
                    onPress={handleOpenFilter}
                >
                    <Ionicons name="filter-outline" size={24} color={COLORS.textLight} />
                </TouchableOpacity>
            </View>

            {/* Products List (FlatList) */}
            {filteredProducts.length === 0 ? (
                <Text style={styles.emptyMessage}>No hay productos cargados.</Text>
            ) : (
                <FlatList
                    data={filteredProducts}
                    keyExtractor={(item) => item.id}
                    key={filterOption} 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    renderItem={renderProductCard}
                />
            )}

            {/* Floating Add Button */}
            <TouchableOpacity style={styles.floatingButton} onPress={handleAddProduct}>
                <Ionicons name="add" size={32} color={COLORS.secondaryYellow} />
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
                        <Text style={[styles.modalTitle, { color: COLORS.primaryPurple }]}>Filtrar y Ordenar</Text>
                        
                        {/* Ordenar Section */}
                        <View style={styles.filterSection}>
                            <Text style={[styles.filterSectionTitle, { color: COLORS.textDark }]}>Ordenar por Nombre</Text>
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
                                        A-Z
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
                                        Z-A
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        
                        {/* Stock Section */}
                        <View style={styles.filterSection}>
                            <Text style={[styles.filterSectionTitle, { color: COLORS.textDark }]}>Stock</Text>
                            <TouchableOpacity
                                style={[
                                    styles.filterCategoryButtonFull,
                                    tempFilterOption === 'Stock Bajo' && styles.filterOptionButtonSelected
                                ]}
                                onPress={() => setTempFilterOption('Stock Bajo')}
                            >
                                <Ionicons name="cube-outline" size={20} color={tempFilterOption === 'Stock Bajo' ? COLORS.primaryPurple : COLORS.textDark} />
                                <Text style={[
                                    styles.filterCategoryText,
                                    tempFilterOption === 'Stock Bajo' && styles.filterOptionButtonTextSelected
                                ]}>
                                    Stock Bajo (≤ 5)
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Categories Section */}
                        <View style={styles.filterSection}>
                            <Text style={[styles.filterSectionTitle, { color: COLORS.textDark }]}>Categorías</Text>
                            <View style={styles.filterRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.filterCategoryButton,
                                        tempFilterOption === 'Canes' && styles.filterOptionButtonSelected
                                    ]}
                                    onPress={() => setTempFilterOption('Canes')}
                                >
                                    <Ionicons name="paw" size={20} color={tempFilterOption === 'Canes' ? COLORS.primaryPurple : COLORS.textDark} />
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
                                        tempFilterOption === 'Felinos' && styles.filterOptionButtonSelected
                                    ]}
                                    onPress={() => setTempFilterOption('Felinos')}
                                >
                                    <Ionicons name="paw" size={20} color={tempFilterOption === 'Felinos' ? COLORS.primaryPurple : COLORS.textDark} />
                                    <Text style={[
                                        styles.filterCategoryText,
                                        tempFilterOption === 'Felinos' && styles.filterOptionButtonTextSelected
                                    ]}>
                                        Felinos
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.filterCategoryButtonFull,
                                    tempFilterOption === 'Peces' && styles.filterOptionButtonSelected
                                ]}
                                onPress={() => setTempFilterOption('Peces')}
                            >
                                <Ionicons name="fish" size={20} color={tempFilterOption === 'Peces' ? COLORS.primaryPurple : COLORS.textDark} />
                                <Text style={[
                                    styles.filterCategoryText,
                                    tempFilterOption === 'Peces' && styles.filterOptionButtonTextSelected
                                ]}>
                                    Peces
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.filterCategoryButtonFull,
                                    tempFilterOption === 'Todos' && styles.filterOptionButtonSelected
                                ]}
                                onPress={() => setTempFilterOption('Todos')}
                            >
                                <Ionicons name="globe-outline" size={20} color={tempFilterOption === 'Todos' ? COLORS.primaryPurple : COLORS.textDark} />
                                <Text style={[
                                    styles.filterCategoryText,
                                    tempFilterOption === 'Todos' && styles.filterOptionButtonTextSelected
                                ]}>
                                    Mostrar Todos
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.filterActionsRow}>
                            <TouchableOpacity 
                                style={[styles.clearButton, { borderColor: COLORS.primaryPurple, backgroundColor: COLORS.secondaryYellow }]}
                                onPress={handleClearFilter}
                            >
                                <Ionicons name="brush-outline" size={20} color={COLORS.textDark} />
                                <Text style={[styles.clearButtonText, { color: COLORS.textDark }]}>Limpiar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.applyButton, { backgroundColor: COLORS.primaryPurple }]}
                                onPress={handleApplyFilter}
                            >
                                <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.textLight} />
                                <Text style={styles.applyButtonText}>Aplicar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* --- MODAL DE ALERTA--- */}
            <CustomAlertModal
                isVisible={customAlertData.isVisible}
                title={customAlertData.title}
                message={customAlertData.message}
                onConfirm={customAlertData.onConfirm}
                onCancel={customAlertData.onCancel}
                confirmText={customAlertData.confirmText}
                cancelText={customAlertData.cancelText}
                type={customAlertData.type}
            />
        </View>
    );
}

// --- ESTILOS PARA EL MODAL DE ALERTA ---
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
        borderTopColor: COLORS.primaryPurple, 
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
        color: COLORS.textLight, 
    },
});

// --- ESTILOS PRINCIPALES ---
const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: COLORS.backgroundLight, 
        paddingTop: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: COLORS.cardBackground, 
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightPurple, 
    },
    title: { 
        fontSize: 18, 
        fontWeight: 'bold',
        textAlign: 'center',
        color: COLORS.primaryPurple, 
    },
    searchContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 10,
        marginBottom: 10,
        alignItems: 'center',
        backgroundColor: COLORS.cardBackground,
    },
    searchInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.cardBackground,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: COLORS.primaryPurple, 
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginRight: 10,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: COLORS.textDark,
        paddingVertical: 0, 
    },
    filterButton: {
        width: 48,
        height: 48,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: COLORS.primaryPurple,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.primaryPurple, 
    },
    scrollContent: {
        paddingHorizontal: 15,
        paddingTop: 10,
        paddingBottom: 100,
    },
    // --- ESTILOS DE LA CARD ---
    productCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.cardBackground,
        borderRadius: 15,
        borderLeftWidth: 5,
        borderLeftColor: COLORS.primaryPurple,
        padding: 8, 
        marginBottom: 10, 
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 4,
        shadowColor: COLORS.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, 
        shadowRadius: 3,
        minHeight: 85, 
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
    },
    productImage: {
        width: 55, 
        height: 55,
        borderRadius: 8,
        resizeMode: 'cover',
    },
    placeholderImage: {
        width: 55,
        height: 55,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.lightPurple,
    },
    statusAndCategory: {
        marginLeft: 8,
        justifyContent: 'center',
    },
    categoryTag: {
        fontSize: 9,
        fontWeight: 'bold',
        color: COLORS.primaryPurple,
        backgroundColor: COLORS.lightPurple,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginBottom: 4, 
        alignSelf: 'flex-start', 
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    activeBadge: {
        backgroundColor: COLORS.safeStockGreen,
    },
    inactiveBadge: {
        backgroundColor: COLORS.lowStockRed,
    },
    statusBadgeText: {
        color: COLORS.buttonText,
        fontSize: 9,
        fontWeight: '600',
    },
    centerContent: {
        flex: 1, 
        justifyContent: 'center',
        marginRight: 10,
    },
    productName: {
        fontSize: 14, 
        fontWeight: '700',
        color: COLORS.textDark,
        marginBottom: 5,
    },
    priceStockRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start', 
    },
    productPrice: {
        fontSize: 13, 
        fontWeight: 'bold',
        color: COLORS.primaryPurple,
        marginRight: 10,
    },
    stockBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 10,
    },
    safeStockBadge: {
        backgroundColor: COLORS.safeStockGreen + '20',
        borderWidth: 1,
        borderColor: COLORS.safeStockGreen,
    },
    lowStockBadge: {
        backgroundColor: COLORS.lowStockRed + '20',
        borderWidth: 1,
        borderColor: COLORS.lowStockRed,
    },
    stockText: {
        fontSize: 10, 
        fontWeight: '600',
        color: COLORS.textDark,
    },
    lowStockText: {
        color: COLORS.lowStockRed,
    },
    rightContent: {
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        marginLeft: 10,
    },
    // --- NUEVOS ESTILOS PARA BOTONES DE TEXTO ---
    actionTextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: COLORS.lightPurple,
        marginVertical: 4, 
        minWidth: 80, 
    },
    deleteTextButton: {
        backgroundColor: COLORS.secondaryYellow + '40', 
    },
    actionButtonText: {
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 4,
    },
    floatingButton: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        backgroundColor: COLORS.primaryPurple,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: COLORS.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 5,
    },
    emptyMessage: {
        textAlign: 'center',
        fontSize: 16,
        color: COLORS.textDark,
        marginTop: 40,
    },
    // Modal styles (Filter)
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: COLORS.primaryPurple,
        padding: 25,
        width: '85%',
        maxWidth: 350,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: COLORS.primaryPurple,
    },
    filterSection: {
        marginBottom: 18,
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightPurple,
    },
    filterSectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'left',
        color: COLORS.textDark,
    },
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    filterOptionButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: COLORS.primaryPurple,
        backgroundColor: COLORS.cardBackground,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    filterOptionButtonSelected: {
        backgroundColor: COLORS.lightPurple,
        borderColor: COLORS.primaryPurple,
    },
    filterOptionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textDark,
    },
    filterOptionButtonTextSelected: {
        color: COLORS.primaryPurple,
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
        borderColor: COLORS.primaryPurple,
        backgroundColor: COLORS.cardBackground,
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
        borderColor: COLORS.primaryPurple,
        backgroundColor: COLORS.cardBackground,
        marginBottom: 12,
        alignSelf: 'stretch',
        marginHorizontal: 5,
    },
    filterCategoryText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textDark,
        marginLeft: 8,
    },
    filterActionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
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
        borderColor: COLORS.secondaryYellow, 
        backgroundColor: COLORS.secondaryYellow, 
        marginRight: 8,
    },
    clearButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textDark, 
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
        backgroundColor: COLORS.primaryPurple, 
        marginLeft: 8,
    },
    applyButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textLight, 
        marginLeft: 6,
    },
});