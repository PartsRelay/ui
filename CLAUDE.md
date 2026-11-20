# Parts Relay UI

- Every new feature (a `feat` pull request) ships behind a PostHog feature flag, off by default: add its name to `Flag` of `src/core/flags.ts`, read it with `useFlag` of `src/ui/hooks/use-flag.ts` and test the feature with the flag on and off. A feature that also changes the core uses the same flag name there.
