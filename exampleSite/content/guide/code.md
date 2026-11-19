---
title: Code blocks
weight: 1
description: An agentica block with its output, and a block that does not compile.
aliases: [/old-code/]
---

## A program

An `agentica` (or `agc`) block is colored by the highlighter after Hugo runs. An `output` block shows what the program prints.

```agentica
# A color and its name.
MAX_LITERS = 10.0

enum Color
  Red
  Green
end

struct Paint
  color: Color
  liters: Float
end

def name(c: Color) -> String
  case c
    Color.Red -> return "red"
    Color.Green -> return "green"
  end
end

def shade(c: Color) -> String = "#{name(c)} paint"

def describe(p: Paint) -> String
  big = p.liters > 2.5 && p.liters <= MAX_LITERS
  return "#{shade(p.color)}: #{p.liters} liters, big: #{big}\n"
end

def main() -> Void
  print(describe(Paint(color: Color.Red, liters: 4.0)))
  puts(nil == nil)
end
```

```output
red paint: 4.0 liters, big: true
true
```

## A block that does not compile

`expect="CODE"` adds a box with the diagnostic code under the block.

```agentica {expect="CHECK-TYPE-MISMATCH"}
def main() -> Void
  x: Int = "one"
end
```

## Other languages

Other languages get Hugo's own colors.

```sh
make example
```

```input
3 4
```

## A prompt

A `prompt` block is text to paste into a coding agent. It wraps, so a phone reader sees all of it.

```prompt
Install Agentica on this machine from https://www.agentica-lang.com/agentica/getting-started/ with the install script for this platform, put the binary on PATH, run `agentica version` to check it, then write a hello world program in hello.agc and run it with `agentica hello.agc`.
Tell me each command you ran and its output.
```

## A module file

A block with a `file` attribute is a module that the other blocks of the page can import.

```agentica {file="shapes.agc"}
struct Point
  x: Int
  y: Int
end
```
