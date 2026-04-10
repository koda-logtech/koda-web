import { useQuery } from "@tanstack/react-query";
import { clienteService } from "@services/clienteService";

export const useClientes = (options: any = {}) => {
  return useQuery<any>({
    queryKey: ["clientes"],
    queryFn: () => clienteService.getAll(),
    ...options,
  });
};
