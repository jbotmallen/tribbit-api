// RegisterScreen.styles.ts
import { StyleSheet } from "react-native";
import Colors from "@constants/Colors";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 60,
    paddingHorizontal: 24,
  },
  headerContainer: {
    gap: 10,
    marginTop: 60,
  },
  title: {
    fontSize: 40,
    fontWeight: "600",
  },
  text: {
    fontSize: 22,
    lineHeight: 30,
    color: Colors.light.gray,
  },
  inputsContainer: {
    gap: 20,
    marginTop: 40,
  },
  inputContainer: {
    marginBottom: 10,
    height: 50,
  },
  inputField: {
    fontSize: 20,
    paddingVertical: 5,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  registerText: {
    color: "blue",
    textDecorationLine: "underline",
  },
});

export default styles;
