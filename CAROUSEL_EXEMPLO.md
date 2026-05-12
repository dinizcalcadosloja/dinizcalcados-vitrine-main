# Componente Carousel - Exemplo de Uso

## Importação

```tsx
import { Carousel } from "@/components/carousel";
```

## Uso Básico

```tsx
<Carousel>
  <div className="flex-none w-[200px] snap-start">Card 1</div>
  <div className="flex-none w-[200px] snap-start">Card 2</div>
  <div className="flex-none w-[200px] snap-start">Card 3</div>
  <div className="flex-none w-[200px] snap-start">Card 4</div>
  <div className="flex-none w-[200px] snap-start">Card 5</div>
</Carousel>
```

## Com Produtos

```tsx
<Carousel>
  {products.map((product) => (
    <div key={product.id} className="flex-none w-[45%] sm:w-[30%] md:w-[23%] snap-start">
      <ProductCard product={product} />
    </div>
  ))}
</Carousel>
```

## Props

| Prop        | Tipo      | Padrão        | Descrição                                   |
| ----------- | --------- | ------------- | ------------------------------------------- |
| children    | ReactNode | (obrigatório) | Cards/itens do carrossel                    |
| itemsToShow | number    | 4             | Quantos itens mostrar por vez (informativo) |
| gap         | number    | 12            | Espaçamento entre itens em pixels           |
| showArrows  | boolean   | true          | Mostrar/ocultar botões de navegação         |
| className   | string    | ""            | Classes CSS adicionais                      |

## Características

✅ **Arrastar com mouse**: Clique e arraste para navegar  
✅ **Touch support**: Funciona em dispositivos móveis  
✅ **Botões de navegação**: Setas esquerda/direita  
✅ **Animação suave**: Transições suaves ao navegar  
✅ **Scrollbar invisível**: Interface limpa sem scrollbar  
✅ **Snap points**: Cards se alinham automaticamente  
✅ **Responsivo**: Adapta-se a diferentes tamanhos de tela  
✅ **Visual feedback**: Cursor muda ao arrastar

## Estilo dos Cards

Os cards dentro do Carousel devem ter:

- `flex-none` - Previne encolhimento
- `w-[...]` - Largura fixa ou percentual
- `snap-start` - Alinha ao início ao parar de rolar

Exemplo:

```tsx
className = "flex-none w-[250px] snap-start";
```

## Exemplo Completo - Seção de Produtos

```tsx
<section className="my-8">
  <h2 className="mb-4 text-xl font-bold">Produtos em Destaque</h2>

  <Carousel gap={16} showArrows={true}>
    {featuredProducts.map((product) => (
      <div key={product.id} className="flex-none w-[280px] snap-start">
        <div className="rounded-lg border bg-card p-4 h-full">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-48 object-cover rounded-md mb-3"
          />
          <h3 className="font-semibold">{product.name}</h3>
          <p className="text-lg font-bold text-primary mt-2">{formatBRL(product.price)}</p>
        </div>
      </div>
    ))}
  </Carousel>
</section>
```

## Carrossel sem Botões

```tsx
<Carousel showArrows={false}>{/* seus cards aqui */}</Carousel>
```

## Múltiplos Carrosséis na Mesma Página

```tsx
<div className="space-y-12">
  {/* Carrossel 1 */}
  <section>
    <h2>Novidades</h2>
    <Carousel>
      {newProducts.map(...)}
    </Carousel>
  </section>

  {/* Carrossel 2 */}
  <section>
    <h2>Mais Vendidos</h2>
    <Carousel>
      {bestSellers.map(...)}
    </Carousel>
  </section>
</div>
```
