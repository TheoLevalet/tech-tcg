import { render, screen } from "@testing-library/react-native";
import HomeScreen from "../app/index.tsx";

describe("HomeScreen", () => {
  it("affiche la main de départ piochée par le moteur", async () => {
    await render(<HomeScreen />);
    expect(screen.getByText("Main de départ : Dragon, Chevalier")).toBeTruthy();
  });
});
