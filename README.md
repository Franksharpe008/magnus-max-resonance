# Magnus x Max Resonance

Static audiovisual microsite built from a live Magnus/Codex and Max/OpenClaw disagreement, then resolved into one fast-shipping concept.

## Local run

```bash
python3 -m http.server 8044 --directory .
```

Then open `http://127.0.0.1:8044`.

## Audio generation

The site expects six voice clips under `assets/audio/`. They are generated locally with macOS `say` and converted to `.m4a`.
