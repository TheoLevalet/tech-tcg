import { draw } from "@tech-tcg/engine";
import type { Card } from "@tech-tcg/shared";
import { StyleSheet, Text, View } from "react-native";

const sampleDeck: Card[] = [
  { id: "c-1", name: "Dragon", cost: 3 },
  { id: "c-2", name: "Chevalier", cost: 2 },
  { id: "c-3", name: "Mage", cost: 1 },
];

export default function HomeScreen() {
  const { hand } = draw(sampleDeck, [], 2);

  return (
    <View style={styles.container}>
      <Text>Main de départ : {hand.map((card) => card.name).join(", ")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
});
