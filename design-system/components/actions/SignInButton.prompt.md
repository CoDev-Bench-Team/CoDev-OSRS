Google sign-in button — the single auth affordance on the OSRS login card.

```jsx
<SignInButton darkmode={false} mobile={false} cta="Sign in with Google" />
```

Variants: `darkmode` (blue shell / white shell) × `mobile` (drops the 32px trailing pad). The login mockup overrides it to a 242×64 pill with a 1px black ring and a 32px radius — apply that via `style` when recreating that screen.
