import { AppDataContext } from "@/types/appData";
import React from "react";

export const AppContext = React.createContext<AppDataContext | null>(null);
