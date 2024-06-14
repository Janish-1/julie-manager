import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ImageBackground, Image, TouchableOpacity } from 'react-native';
import { BACKEND_URL } from "@env";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export default function Splash({navigation}) {
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [logo, setLogo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchImage = async (imageType) => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/getimages/?name=${imageType}`,{
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 1234,
          },    
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const imageData = await response.json();
        const imageUrl = BACKEND_URL + imageData[0].url;
        if (imageType === 'background') {
          setBackgroundImage(imageUrl);
        } else if (imageType === 'logo') {
          setLogo(imageUrl);
        }
      } catch (error) {
        setError(error.message);
        console.error(`Error fetching ${imageType} image:`, error);
      }
    };

    fetchImage('background');
    fetchImage('logo');
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImageBackground source={{ uri: backgroundImage }} style={styles.image}>
        <View style={styles.contentContainer}>
          <Image source={{ uri: logo }} style={styles.logo} />
          <TouchableOpacity style={styles.buttonContainer} onPress={()=>navigation.navigate('Login')}>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    flex: 1,
    resizeMode: "stretch",
    justifyContent: "center"
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  logo: {
    width: 250,
    height: 100,
    marginBottom: 120,
    resizeMode: "contain",
  },
  buttonContainer: {
    backgroundColor: 'red',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    width: 300,
    alignContent: 'center',
  },
  buttonText: {
    textAlign: 'center',
    color: 'white',
    fontSize: 16
  }
});
