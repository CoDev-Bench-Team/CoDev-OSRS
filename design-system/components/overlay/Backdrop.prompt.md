The modal scrim. OSRS has exactly one: 50% black, no blur, no fade-in specified in the source.

```jsx
<Backdrop><RejectDialog /></Backdrop>
```

Fill comes from the `--components-backdrop-fill` Figma variable (`rgba(0,0,0,0.5)`). It positions absolutely against the nearest positioned ancestor — give the app frame `position: relative`.
