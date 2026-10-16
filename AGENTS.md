# Project tools

## NovelAI

This project has a local NovelAI adapter at `tools/novelai/NovelAI.ps1` and usage documentation at `tools/novelai/README.md`. Prefer it when the user explicitly requests NovelAI images.

- `-Action Status` reports only whether an encrypted token is present. `-Action Check` performs a read-only subscription check without generation.
- Never read or print `.private` files, clipboard contents, tokens, Authorization headers, or raw HTTP errors. Use the provided tools; ask the user to enter credentials only in the local masked setup window.
- `-Action Generate -RequestFile <path>` previews parameters. Add `-Execute` only for an image generation the user requested. Each execution sends one request and may use their subscription allowance. Do not automatically retry uncertain failures or start background/batch generation.
- Copy the example request for each actual image. Preserve prompt/seed/settings alongside each output. For V4/V4.5, synchronize base positive and negative captions with their top-level prompt fields.
- The default image output directory is `F:\ai影片\灼熱bonfire mv\source\novelai`, with a separate timestamped folder for each generation. The preview returns `output_directory`; `-OutputDirectory` can override it for one invocation and must be part of the full script command, never run alone.
- Use Windows PowerShell under the same Windows user as the setup window. If the sandbox blocks DPAPI or network, use the normal approval mechanism for the same narrow command; never expose the token as a workaround.
- Offline checks are `tools/novelai/Test-Local.ps1`; they use isolated dummy credentials and mocked responses. Distinguish offline success, real subscription verification, and actual image generation.
- This is a project-local script integration. No shared Skill, MCP definition, provider, or auth/model configuration was changed. The user's CC Switch governance instructions still apply to any future shared Skills/MCP changes.
