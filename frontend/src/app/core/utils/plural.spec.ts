import { plural } from './plural';

describe('plural', () => {
  it('usa el singular solo con 1', () => {
    expect(plural(1, 'comentario', 'comentarios')).toBe('1 comentario');
    expect(plural(0, 'comentario', 'comentarios')).toBe('0 comentarios');
    expect(plural(3, 'tema', 'temas')).toBe('3 temas');
  });

  it('separa los miles', () => {
    expect(plural(1500, 'vista', 'vistas')).toBe('1.500 vistas');
  });
});
