The catalog tile — one per item in the Supply Catalog grid, two per row at 1440.

```jsx
<SupplyCard category="Devices" name="Monitor" model="Dell Latitude" quantity={1} onAction={addToList} />
```

436px wide, 180px photo, 18px content padding with a 12px stack, `--shadow-card` and a 10px radius. The primary button is 304×42 brand red; the stepper is a 4px-radius canvas-fill group. Pass `availability="unavailable"` to flip the chip red.
