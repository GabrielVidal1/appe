Typescript/React coding style

when creating a new react component, allways add props with at least the className and with React.FC<...Props> syntax

for example a new button :

```ts
import { cn } from "@/lib/utils";

interface ButtonProps {
  className?: string
}

const Button: React.FC<ButtonProps> = ({ className, ... }) => {
  // use states

  // use memo

  // functions

  // use effects

  return (<... className={cn(className, "...")}>

  );
}

export default Button;
```

when asked for a full feature, split in different components in

use lodash when possible without using the \_, by directly importing the right lodash function eg:

```ts
const result = chain(array).map(process).value();
```
