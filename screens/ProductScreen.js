import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../src/config/firebaseConfig';

export default function PantallaProductos({ navigation }) {
  const [producto, setProducto] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: '',
    cantidadMinima: '',
    stock: '',
    proveedor: '',
    estado: 'ACTIVO',
    imagen: null
  });

  // Estados para mostrar/ocultar ventanas emergentes
  const [ventanaVisible, setVentanaVisible] = useState(false);
  const [tipoVentana, setTipoVentana] = useState(''); // 'exito', 'cancelar', 'error'
  const [mensajeVentana, setMensajeVentana] = useState('');
  const [infoProveedor, setInfoProveedor] = useState('');

  const categorias = ['Comida para Mascotas', 'Juguetes', 'Medicinas', 'Accesorios', 'Productos de Limpieza'];
  const estadosProducto = ['ACTIVO', 'INACTIVO'];
  const proveedores = [
    { nombre: 'PetFood Distribuidora', descuento: 0.10 },
    { nombre: 'Mascotas del Sur', descuento: 0.15 }, 
    { nombre: 'Veterinaria Central', descuento: 0.05 },
    { nombre: 'Suministros Pet', descuento: 0.12 },
    { nombre: 'Distribuidora Animal', descuento: 0.08 }
  ];
  const mostrarVentana = (tipo, mensaje) => {
    setTipoVentana(tipo);
    setMensajeVentana(mensaje);
    setVentanaVisible(true);
  };

  const verificarCamposCompletos = () => {
    if (!producto.nombre || !producto.descripcion || !producto.precio || !producto.categoria || !producto.stock || !producto.proveedor) {
      mostrarVentana('error', 'Hay campos que no completó, complete los campos obligatorios para continuar.');
      return false;
    }
    return true;
  };

  const guardarProducto = async () => {
    if (!verificarCamposCompletos()) return;

    try {
      await addDoc(collection(db, 'productos'), {
        ...producto,
        precio: parseFloat(producto.precio),
        cantidadMinima: parseInt(producto.cantidadMinima) || 0,
        stock: parseInt(producto.stock) || 0,
        fechaCreacion: new Date(),
      });
      
      mostrarVentana('exito', 'Los datos se aplicaron correctamente.');
      // Limpiar formulario después del éxito
      setTimeout(() => {
        setProducto({
          nombre: '',
          descripcion: '',
          precio: '',
          categoria: '',
          cantidadMinima: '',
          stock: '',
          proveedor: '',
          estado: 'ACTIVO',
          imagen: null
        });
        setInfoProveedor('');
      }, 1500);
    } catch (error) {
      mostrarVentana('error', 'Error al guardar el producto. Intente nuevamente.');
    }
  };

  const preguntarSiCancelar = () => {
    mostrarVentana('cancelar', '¿Está seguro de que desea cancelar? Se perderán todos los datos ingresados.');
  };

  const seleccionarImagen = async () => {
    console.log('Función seleccionarImagen llamada');
    try {
      // Pedir permisos para acceder a la galería
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permisos de galería:', status);
      if (status !== 'granted') {
        Alert.alert('Permisos necesarios', 'Necesitamos permisos para acceder a tus fotos.');
        return;
      }

      // Mostrar opciones para seleccionar imagen
      Alert.alert(
        'Seleccionar imagen',
        'Elige una opción',
        [
          { text: 'Cámara', onPress: abrirCamara },
          { text: 'Galería', onPress: abrirGaleria },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.log('Error en seleccionarImagen:', error);
      Alert.alert('Error', 'No se pudo acceder a las imágenes.');
    }
  };

  const abrirCamara = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos necesarios', 'Necesitamos permisos para usar la cámara.');
        return;
      }

      const resultado = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!resultado.canceled) {
        setProducto({...producto, imagen: resultado.assets[0].uri});
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo tomar la foto.');
    }
  };

  const abrirGaleria = async () => {
    console.log('Abriendo galería...');
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      console.log('Resultado de galería:', resultado);
      if (!resultado.canceled) {
        console.log('Imagen seleccionada:', resultado.assets[0].uri);
        setProducto({...producto, imagen: resultado.assets[0].uri});
      }
    } catch (error) {
      console.log('Error en abrirGaleria:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    }
  };

  const confirmarCancelacion = () => {
    setProducto({
      nombre: '',
      descripcion: '',
      precio: '',
      categoria: '',
      cantidadMinima: '',
      stock: '',
      proveedor: '',
      estado: 'ACTIVO',
      imagen: null
    });
    setInfoProveedor('');
    setVentanaVisible(false);
    navigation.goBack();
  };

  const crearVentanaEmergente = () => {
    let colorDeFondo, icono, colorBoton, textoBoton, alPresionar;

    switch (tipoVentana) {
      case 'exito':
        colorDeFondo = '#d4edda';
        icono = '✓';
        colorBoton = '#28a745';
        textoBoton = 'ACEPTAR';
        alPresionar = () => setVentanaVisible(false);
        break;
      case 'cancelar':
        colorDeFondo = '#fcfbf8ff';
        icono = '⚠';
        colorBoton = '#dc3545';
        textoBoton = 'Cancelar';
        alPresionar = confirmarCancelacion;
        break;
      case 'error':
        colorDeFondo = '#cce7ff';
        icono = 'i';
        colorBoton = '#007bff';
        textoBoton = 'Entendido';
        alPresionar = () => setVentanaVisible(false);
        break;
      default:
        return null;
    }

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={ventanaVisible}
        onRequestClose={() => setVentanaVisible(false)}
      >
        <View style={styles.fondoVentana}>
          <View style={[styles.contenidoVentana, { backgroundColor: colorDeFondo }]}>
            <View style={styles.iconoVentana}>
              <Text style={styles.textoIcono}>{icono}</Text>
            </View>
            
            <Text style={styles.tituloVentana}>
              {tipoVentana === 'exito' && 'Producto Actualizado'}
              {tipoVentana === 'cancelar' && 'Confirmar Cancelación'}
              {tipoVentana === 'error' && 'Campos Obligatorios'}
            </Text>
            
            <Text style={styles.mensajeVentana}>{mensajeVentana}</Text>
            
            <View style={styles.botonesVentana}>
              {tipoVentana === 'cancelar' && (
                <TouchableOpacity
                  style={[styles.botonVentana, { backgroundColor: '#6c757d' }]}
                  onPress={() => setVentanaVisible(false)}
                >
                  <Text style={styles.textoBotonVentana}>Continuar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.botonVentana, { backgroundColor: colorBoton }]}
                onPress={alPresionar}
              >
                <Text style={styles.textoBotonVentana}>{textoBoton}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.contenedorPrincipal} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.pantalla} 
        contentContainerStyle={styles.contenedorScroll}
        showsVerticalScrollIndicator={true}
      >
      
      <View style={styles.formulario}>
        {/* Sección de imagen del producto */}
        <View style={styles.seccionImagen}>
          <Text style={styles.etiqueta}>Imagen Actual</Text>
          <View style={styles.contenedorImagen}>
            <View style={styles.vistaPrevia}>
              {producto.imagen ? (
                <Image source={{ uri: producto.imagen }} style={styles.imagenProducto} />
              ) : (
                <View style={styles.imagenPlaceholder}>
                    
                  <Text style={styles.textoPlaceholder}>Sin imagen</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.botonImagen} onPress={seleccionarImagen}>
              <Text style={styles.textoBotonImagen}>
                {producto.imagen ? 'Cambiar imagen' : 'Agregar imagen'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.etiqueta}>Nombre del Producto</Text>
        <TextInput
          style={styles.campoTexto}
          value={producto.nombre}
          onChangeText={(texto) => setProducto({...producto, nombre: texto})}
          placeholder="Ingrese el nombre del producto"
        />

        <Text style={styles.etiqueta}>Categoría</Text>
        <View style={styles.contenedorSelector}>
          <Picker
            selectedValue={producto.categoria}
            style={styles.selector}
            onValueChange={(valorSeleccionado) => setProducto({...producto, categoria: valorSeleccionado})}
          >
            <Picker.Item label="Seleccione una categoría" value="" />
            {categorias.map((categoria, indice) => (
              <Picker.Item key={indice} label={categoria} value={categoria} />
            ))}
          </Picker>
        </View>

        <Text style={styles.etiqueta}>Stock Minimo</Text>
        <TextInput
          style={styles.campoTexto}
          value={producto.cantidadMinima}
          onChangeText={(texto) => setProducto({...producto, cantidadMinima: texto})}
          placeholder="0"
          keyboardType="numeric"
        />

        <Text style={styles.etiqueta}>Precio</Text>
        <TextInput
          style={styles.campoTexto}
          value={producto.precio}
          onChangeText={(texto) => setProducto({...producto, precio: texto})}
          placeholder="$0.00"
          keyboardType="numeric"
        />

        <Text style={styles.etiqueta}>Stock</Text>
        <TextInput
          style={styles.campoTexto}
          value={producto.stock}
          onChangeText={(texto) => setProducto({...producto, stock: texto})}
          placeholder="Cantidad disponible"
          keyboardType="numeric"
        />

        <Text style={styles.etiqueta}>Proveedor</Text>
        <View style={styles.contenedorSelector}>
          <Picker
            selectedValue={producto.proveedor}
            style={styles.selector}
            onValueChange={(valorSeleccionado) => {
              setProducto({...producto, proveedor: valorSeleccionado});
              // Mostrar información del proveedor seleccionado
              const proveedorSeleccionado = proveedores.find(p => p.nombre === valorSeleccionado);
              if (proveedorSeleccionado) {
                const descuentoPorcentaje = (proveedorSeleccionado.descuento * 100).toFixed(0);
                setInfoProveedor(`Descuento disponible: ${descuentoPorcentaje}%`);
              } else {
                setInfoProveedor('');
              }
            }}
          >
            <Picker.Item label="Seleccione un proveedor" value="" />
            {proveedores.map((proveedor, indice) => (
              <Picker.Item key={indice} label={proveedor.nombre} value={proveedor.nombre} />
            ))}
          </Picker>
        </View>
        {infoProveedor ? (
          <View style={styles.infoProveedor}>
            <Text style={styles.textoInfoProveedor}>ℹ️ {infoProveedor}</Text>
          </View>
        ) : null}

        <Text style={styles.etiqueta}>Estado del Producto</Text>
        <View style={styles.contenedorSelector}>
          <Picker
            selectedValue={producto.estado}
            style={styles.selector}
            onValueChange={(valorSeleccionado) => setProducto({...producto, estado: valorSeleccionado})}
          >
            {estadosProducto.map((estado, indice) => (
              <Picker.Item key={indice} label={estado} value={estado} />
            ))}
          </Picker>
        </View>

        <Text style={styles.etiqueta}>Descripción</Text>
        <TextInput
          style={[styles.campoTexto, styles.areaTexto]}
          value={producto.descripcion}
          onChangeText={(texto) => setProducto({...producto, descripcion: texto})}
          placeholder="Escriba una descripción para el producto"
          multiline
          numberOfLines={4}
        />
      </View>

      {crearVentanaEmergente()}
    </ScrollView>
    
    {/* Botones fijos en la parte inferior */}
    <View style={styles.contenedorBotonesFijo}>
      <TouchableOpacity style={styles.botonGuardar} onPress={guardarProducto}>
        <Text style={styles.textoBotonGuardar}>ACTUALIZAR</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.botonCancelar} onPress={preguntarSiCancelar}>
        <Text style={styles.textoBotonCancelar}>CANCELAR</Text>
      </TouchableOpacity>
    </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedorPrincipal: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  pantalla: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contenedorScroll: {
    paddingBottom: 100, // Espacio para los botones fijos
  },
  encabezado: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  formulario: {
    padding: 20,
  },
  etiqueta: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  campoTexto: {
    borderWidth: 2, // Borde más grueso
    borderColor: '#9c27b0', // Color morado que combina con los botones
    borderRadius: 10, // Esquinas más redondeadas
    padding: 15, // Más padding interno
    fontSize: 16,
    backgroundColor: '#fff',
    shadowColor: '#000', // Sombra sutil
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2, // Sombra en Android
  },
  areaTexto: {
    height: 100,
    textAlignVertical: 'top',
  },
  contenedorSelector: {
    borderWidth: 2, // Mismo grosor que los campos de texto
    borderColor: '#9c27b0', // Mismo color morado
    borderRadius: 10, // Mismas esquinas redondeadas
    backgroundColor: '#fff',
    shadowColor: '#000', // Misma sombra
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2, // Sombra en Android
  },
  selector: {
    height: 50,
  },
  contenedorBotones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40, // Más espacio arriba
    marginBottom: 30, // Más espacio abajo
    paddingHorizontal: 10,
    gap: 15, // Más espacio entre botones
  },
  contenedorBotonesFijo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: 30, // Espacio extra para dispositivos con notch
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 15,
  },
  botonGuardar: {
    flex: 1,
    backgroundColor: '#9c27b0',
    paddingVertical: 18, // Un poco más alto
    borderRadius: 8,
    alignItems: 'center',
    elevation: 3, // Sombra en Android
    shadowColor: '#000', // Sombra en iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  textoBotonGuardar: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  botonCancelar: {
    flex: 1,
    backgroundColor: '#f44336',
    paddingVertical: 18, // Un poco más alto
    borderRadius: 8,
    alignItems: 'center',
    elevation: 3, // Sombra en Android
    shadowColor: '#000', // Sombra en iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  textoBotonCancelar: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Estilos de las ventanas emergentes
  fondoVentana: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contenidoVentana: {
    width: '85%',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  iconoVentana: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ceb1b1ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  textoIcono: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  tituloVentana: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  mensajeVentana: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    lineHeight: 20,
  },
  botonesVentana: {
    flexDirection: 'row',
    gap: 10,
  },
  botonVentana: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    minWidth: 80,
  },
  textoBotonVentana: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoProveedor: {
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#2196f3',
  },
  textoInfoProveedor: {
    color: '#1976d2',
    fontSize: 14,
    fontStyle: 'italic',
  },
  // Estilos para la sección de imagen
  seccionImagen: {
    marginBottom: 20,
  },
  contenedorImagen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  vistaPrevia: {
    flex: 1,
  },
  imagenProducto: {
    width: 120,
    height: 120,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  imagenPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoPlaceholder: {
    color: '#999',
    fontSize: 14,
  },
  botonImagen: {
    backgroundColor: '#9526C8',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 120,
  },
  textoBotonImagen: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});