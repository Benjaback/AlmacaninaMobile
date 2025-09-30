import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';  
import { auth } from '../src/config/firebaseConfig';  
import Login from '../screens/Login';
import SignUp from '../screens/SignUp';
import PantallaInicio from '../screens/Home';
import PantallaProductos from '../screens/ProductScreen';

const Stack = createStackNavigator();

function Navegacion() {
  const [estaAutenticado, setEstaAutenticado] = useState(false);

  useEffect(() => {
    const desuscribir = onAuthStateChanged(auth, usuario => {
      if (usuario) {
        setEstaAutenticado(true); 
      } else {
        setEstaAutenticado(false); 
      }
    });

    return () => desuscribir();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={estaAutenticado ? "Inicio" : "Login"}>
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" component={SignUp} options={{ headerShown: false }} />
        <Stack.Screen name="Inicio" component={PantallaInicio} options={{ headerShown: false }} />
        <Stack.Screen name="GestionarProductos" component={PantallaProductos} options={{ title: 'Gestionar Productos' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default Navegacion;

