import { View, Text, StyleSheet, SafeAreaView, Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import Colors from "@constants/Colors";
import Button from "@components/Button";
import TextInput from "@/components/TextInput";
import styles from "@/styles/AuthScreen.style";
import { useState } from "react";
import axios from "axios";

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    username: "",
    password: "",
  });

  const validateForm = () => {
    const newErrors = { email: "", username: "", password: "" };
    let valid = true;

    // Validate email
    if (!form.email) {
      newErrors.email = "Email is required.";
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address.";
      valid = false;
    }

    // Validate username (minimum 3 characters)
    if (!form.username) {
      newErrors.username = "Username is required.";
      valid = false;
    } else if (form.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters long.";
      valid = false;
    }

    // Validate password (minimum 6 characters)
    if (!form.password) {
      newErrors.password = "Password is required.";
      valid = false;
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long.";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleRegister = async () => {
    console.log("register presesd!");

    if (!validateForm()) return;

    try {
      const response = await axios.post(
        "http://192.168.56.1:3000/api/auth/register",
        {
          email: form.email,
          username: form.username,
          password: form.password,
        }
      );

      if (response.status === 201) {
        Alert.alert("Success", "User registered successfully", [
          {
            text: "OK",
            onPress: () => router.replace("/login"),
          },
        ]);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const message = error.response.data.message || "Registration failed.";
        Alert.alert("Error", message);
      } else {
        Alert.alert("Error", "Network error. Please try again later.");
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Register</Text>
          <Text style={styles.text}>Create a new account with tribbit </Text>
        </View>
        <View style={styles.inputsContainer}>
          <TextInput
            label="Email"
            containerStyle={styles.inputContainer}
            inputStyle={styles.inputField}
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
          />
          {errors.email ? (
            <Text style={styles.errorText}>{errors.email}</Text>
          ) : null}

          <TextInput
            label="Username"
            containerStyle={styles.inputContainer}
            inputStyle={styles.inputField}
            value={form.username}
            onChangeText={(text) => setForm({ ...form, username: text })}
          />
          {errors.username ? (
            <Text style={styles.errorText}>{errors.username}</Text>
          ) : null}

          <TextInput
            label="Password"
            containerStyle={styles.inputContainer}
            inputStyle={styles.inputField}
            value={form.password}
            onChangeText={(text) => setForm({ ...form, password: text })}
            secureTextEntry
          />
          {errors.password ? (
            <Text style={styles.errorText}>{errors.password}</Text>
          ) : null}

          <Button
            title="Register"
            onPress={handleRegister}
            buttonStyle={{
              backgroundColor: Colors.light.purple,
              borderRadius: 8,
            }}
          />
        </View>
        <View style={styles.registerContainer}>
          <Text>Already have an account? </Text>
          <Text
            style={styles.registerText}
            onPress={() => router.replace("/login")}
          >
            Login
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
