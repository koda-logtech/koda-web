import { useQuery } from "@tanstack/react-query";
import { armazemService } from "@services/armazemService";

export const useArmazens = (options: any = {}) => {
  return useQuery<any>({
    queryKey: ["armazens"],
    queryFn: () => armazemService.getAll(),
    ...options,
  });
};
