import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { CoreButton, useToggle } from "./index";

function ToggleTester() {
  const [on, toggle] = useToggle(false);
  return (
    <div>
      <span data-testid="value">{on ? "ON" : "OFF"}</span>
      <CoreButton onClick={toggle}>Toggle</CoreButton>
    </div>
  );
}

describe("CoreButton", () => {
  it("renders children", () => {
    render(<CoreButton>Click me</CoreButton>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });
});

describe("useToggle", () => {
  it("toggles between ON and OFF", async () => {
    render(<ToggleTester />);

    const value = screen.getByTestId("value");
    const button = screen.getByRole("button", { name: /toggle/i });

    expect(value).toHaveTextContent("OFF");

    await fireEvent.click(button);
    expect(value).toHaveTextContent("ON");

    await fireEvent.click(button);
    expect(value).toHaveTextContent("OFF");
  });
});


