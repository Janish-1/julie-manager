import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, ImageBackground, Image, TouchableOpacity, Alert, TextInput } from 'react-native';
import { BACKEND_URL } from "@env";
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Login() {
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [logo, setLogo] = useState(null);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState(null);  // Store the generated OTP
  const otpInputRefs = useRef([React.createRef(), React.createRef(), React.createRef(), React.createRef()]);
  const navigation = useNavigation();

  const generateOtp = () => {
    const votp = Math.floor(1000 + Math.random() * 9000); // Generate a 4-digit OTP
    setGeneratedOtp(votp.toString());  // Convert OTP to string and store it
    console.log("Generated OTP:", votp);  // This log is for debugging and should be removed in production
  };

  useEffect(() => {
    const fetchImage = async (imageType) => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/getimages/?name=${imageType}`, {
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
        console.error(`Error fetching ${imageType} image:`, error);
      }
    };


    fetchImage('background');
    fetchImage('logo');
    generateOtp();
  }, []);

  const handleMobileChange = (text) => {
    // Check if the input already starts with +91, if not, prepend it
    const formattedNumber = text.startsWith('+91') ? text : `+91${text}`;
    setMobile(formattedNumber);
  };

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 3) {
      otpInputRefs.current[index + 1].current.focus();
    }
  };

  const sendOtpToMobile = async () => {
    if (!mobile) {
      Alert.alert('Invalid Mobile Number', 'Please enter a valid mobile number.');
      return;
    }
    
    if (mobile === '+917489270063') {
      autoFillOtp(generatedOtp);
      Alert.alert('Info', 'OTP auto-filled for testing number.');
      return;
    }

    try {
      const response = await axios.post(`${BACKEND_URL}/api/send-otp-mobile/`, {
        phone_number: mobile,
        sentotp: generatedOtp,
      });

      if (response.status) {
        Alert.alert('Success', 'OTP sent to your mobile successfully!');
      } else {
        Alert.alert('Error', 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Failed to send OTP:', error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    }
  };

  const autoFillOtp = (otp) => {
    const otpArray = otp.split('');
    setOtp(otpArray);
    otpArray.forEach((digit, index) => {
      if (otpInputRefs.current[index].current) {
        otpInputRefs.current[index].current.setNativeProps({ text: digit });
      }
    });
  };

  const verifyOtp = async () => {
    const otpString = otp.join('');
    console.log(mobile);
    const newmobile = mobile.substring(3);
    console.log(newmobile);
    if (otpString === generatedOtp) {
      try {
        const response = await axios.post(`${BACKEND_URL}/api/user-profile/`, {
          phone_number: newmobile,
        });
  
        if (response.status === 200 || response.status === 201) {
          console.log('Profile created or found successfully');
          await AsyncStorage.setItem('mobile', newmobile);
          navigation.navigate('Products');
        } else {
          Alert.alert('Error', 'Failed to verify OTP and create profile. Please try again.');
        }
      } catch (error) {
        console.error('Failed to verify OTP and create profile:', error);
        let errorMessage = 'Failed to verify OTP and create profile. Please try again.';
        if (error.response) {
          // The request was made and the server responded with a status code that falls out of the range of 2xx
          errorMessage = error.response.data.error || errorMessage;
        } else if (error.request) {
          // The request was made but no response was received
          errorMessage = 'No response from server. Please check your internet connection.';
        } else {
          // Something happened in setting up the request that triggered an error
          errorMessage = error.message || errorMessage;
        }
        Alert.alert('Error', errorMessage);
      }
    } else {
      console.log('OTP Declined');
      Alert.alert('Invalid OTP', 'Please enter the correct OTP.');
    }
  };
  
  return (
    <View style={styles.container}>
      <ImageBackground source={{ uri: backgroundImage }} style={styles.image}>
        <View style={styles.contentContainer}>
          <Image source={{ uri: logo }} style={styles.logo} />
          <Text style={styles.textContainer}> Log In to continue </Text>
          <View style={styles.inputWithIcon}>
            <Icon name="phone" size={24} color="black" style={styles.iconStyle} />
            <TextInput
              placeholder="Enter Mobile Number"
              style={[styles.inputbox, { flex: 1 }]}
              keyboardType="phone-pad"
              onChangeText={handleMobileChange}
              value={mobile.replace('+91', '')} // Display without prefix for clarity
              maxLength={10} // Only the 10 digits after +91
            />
          </View>
          <TouchableOpacity style={styles.resendButton} onPress={sendOtpToMobile}>
            <Text style={styles.resendButtonText}>Resend OTP ?</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonContainer} onPress={sendOtpToMobile}>
            <Text style={styles.buttonText}>Send OTP</Text>
          </TouchableOpacity>
          <Text style={styles.textContainer_two}>Enter 4 digit OTP</Text>
          <View style={styles.otpContainer}>
            {Array.from({ length: 4 }).map((_, i) => (
              <TextInput
                key={i}
                placeholder="-"
                style={styles.otpInput}
                maxLength={1}
                keyboardType="numeric"
                onChangeText={(text) => handleOtpChange(text, i)}
                value={otp[i]}
                ref={otpInputRefs.current[i]}
              />
            ))}
          </View>
          <TouchableOpacity style={styles.buttonContainer} onPress={verifyOtp}>
            <Text style={styles.buttonText}>Verify OTP</Text>
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
    justifyContent: "center",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  logo: {
    width: 250,
    height: 100,
    resizeMode: "contain",
  },
  buttonContainer: {
    backgroundColor: 'red',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    width: 300,
    alignContent: 'center',
    marginVertical: 5,
  },
  buttonText: {
    textAlign: 'center',
    color: 'white',
    fontSize: 16
  },
  textContainer: {
    fontSize: 30,
    color: 'black',
    paddingBottom: 10,
  },
  textContainer_two: {
    fontSize: 20,
    color: 'black',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'black',
    width: 300,
    paddingVertical: 10,
    marginBottom: 20,
  },
  inputbox: {
    textAlign: 'center',
    fontSize: 20,
    flex: 1,
  },
  iconStyle: {
    paddingLeft: 10,
    paddingRight: 5,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginVertical: 10,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: 'black',
    width: 40,
    textAlign: 'center',
    fontSize: 20,
    paddingVertical: 10,
  },
  resendButton: {
    marginTop: 5,
    alignSelf: 'flex-end',
    padding: 0,
    marginRight: 40,
  },
  resendButtonText: {
    color: 'blue',
    fontSize: 18,
    textAlign: 'left',
  },
  prefixStyle: {
    color: 'black',
    paddingRight: 10,
    fontSize: 20,
    lineHeight: 45, // Adjust line height to vertically center with the text input
  }
});
