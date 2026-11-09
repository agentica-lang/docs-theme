---
title: Reference
weight: 2
description: Signature blocks, which wrap and are colored.
---

# API reference

The first heading of a page, when it is an h1, is the page title on the page.

## File

A `signature` block has one `Name(...) -> Type` per line.

```signature
File.read(path: String) -> Result[String]
File.write(path: String, text: String, mode: Int = 420) -> Result[Void]
```

Reads a file. See the [guide](guide/code.md#a-program).
