import { AppDataContext } from "@appe/core";
import React from "react";

export const AppContext = React.createContext<AppDataContext | null>(null);
