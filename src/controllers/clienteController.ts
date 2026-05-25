import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clienteService } from "@services/clienteService";

export const useClientes = (page?: number, limit?: number, options: any = {}) => {
  return useQuery<any>({
    queryKey: ["clientes", page, limit],
    queryFn: () => clienteService.getAll(page, limit),
    ...options,
  });
};

export const useCreateCliente = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => clienteService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
};

export const useUpdateCliente = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) =>
      clienteService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
};

export const useDeleteCliente = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => clienteService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
};
