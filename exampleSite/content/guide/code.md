---
title: Code blocks
weight: 1
description: An agentica block with its output, and a block that does not compile.
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

def describe(p: Paint) -> String
  big = p.liters > 2.5 && p.liters <= MAX_LITERS
  return "#{name(p.color)}: #{p.liters} liters, big: #{big}\n"
end

def main() -> Void
  print(describe(Paint(color: Color.Red, liters: 4.0)))
  puts(nil == nil)
end
```

```output
red: 4.0 liters, big: true
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
