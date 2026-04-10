import { useQuery } from "@tanstack/react-query";
import { caminhaoService } from "@services/caminhaoService";

export const useCaminhoes = (options: any = {}) => {
  return useQuery<any>({
    queryKey: ["caminhoes"],
    queryFn: () => caminhaoService.getAll(),
    ...options,
  });
};
