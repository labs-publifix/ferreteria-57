-- Generado por scripts/seed-directorio-socios.ts (npm run seed:directorio) a partir de
-- supabase/seed/Directorio_Socios_Comerciales_normalizado.xlsx, hoja Socios_Comerciales: 24 socios.
-- Correr DESPUÉS de la migración 20261102010000_club57_directorio_socios.sql.
--
-- Idempotente: crea los giros que falten y solo inserta socios que no existan
-- todavía (misma clave de origen, teléfono o correo). Re-ejecutarlo no duplica
-- ni modifica lo que ya se editó desde el admin.
-- Los socios entran sin consentimiento de datos (pendiente según el archivo);
-- los que traen giro «Por definir» quedan sin giro, pendientes de completar.
begin;

insert into public.club57_partner_giros (nombre)
values
  ('Accesorios automotrices'),
  ('Accesorios y personalización automotriz'),
  ('Herrería'),
  ('Hotelería'),
  ('Impresión y publicidad'),
  ('Ingeniería industrial'),
  ('Maquinados y herramentales'),
  ('Refaccionaria automotriz'),
  ('Servicios operativos'),
  ('Servicios técnicos / industrial'),
  ('Taller automotriz'),
  ('Taller automotriz – transmisiones'),
  ('Vidrio y aluminio')
on conflict do nothing;

insert into public.club57_partners (
  nombre_comercial, slug, giro_id, contacto, telefono, correo, correo_2, calle, num_ext, num_int,
  colonia, cp, municipio, estado, notas_internas, origen, clave_origen
)
select
  v.nombre_comercial, v.slug, g.id, v.contacto, v.telefono, v.correo, v.correo_2, v.calle, v.num_ext,
  v.num_int, v.colonia, v.cp, v.municipio, v.estado, v.notas_internas, 'carga_masiva', v.clave_origen
from (
values
  ('Accesorios de Autos', 'accesorios-de-autos', 'Accesorios automotrices', 'Ismael Alcantara Hernandez', '4423015895', 'ismaelalcantara763@gmail.com', null, 'Calle 47 Av 4', 'S/N', null, 'Lomas de Casa Blanca', '76080', 'Querétaro', 'Querétaro', 'Sin número exterior en origen.', '1115DA'),
  ('Afinaciones y Cambio de Aceite', 'afinaciones-y-cambio-de-aceite', 'Taller automotriz', 'Mario Piña Arce', '4421386019', 'pina40041@gmail.com', null, 'San Jorge', '25', null, 'Bernardo Quintana Arrioja', '76903', 'Corregidora', 'Querétaro', 'Colonia corregida de "Bernando" a "Bernardo"; revisar.', '1101DA'),
  ('Automotriz Dhimma', 'automotriz-dhimma', 'Taller automotriz', 'Mario Alberto Robles García', '8311042391', 'automotrizdhimmaqro@gmail.com', null, 'Roberto Barrios', '1', null, 'Casa Blanca', '76030', 'Querétaro', 'Querétaro', null, '1034DA'),
  ('Custom Cars', 'custom-cars', 'Accesorios y personalización automotriz', 'Leonardo Daniel Nuñez Trejo', '4424646822', 'dsnielne764@gmail.com', null, 'José María Lozano', '26', null, 'Reforma Agraria', '76086', 'Querétaro', 'Querétaro', null, '1044LG'),
  ('Express Motors', 'express-motors', 'Taller automotriz', 'Juan Alberto Rosales Payan', '4421096785', 'albertoross@hotmail.com', null, 'Fray Juan de San Miguel', '24', null, 'Casa Blanca', '76030', 'Querétaro', 'Querétaro', null, '1040LG'),
  ('Fix-ride', 'fix-ride', 'Taller automotriz', 'Edson Alejandro Aguilar Camacho', '4421411914', 'alxac36@gmail.com', null, 'Fray. Pedro de Gante', '87', null, 'Cimatario', '76030', 'Querétaro', 'Querétaro', null, '1006DA'),
  ('Grafiqro', 'grafiqro', 'Impresión y publicidad', 'José Fernando Hernández Padrón', '4423340076', 'impresionez@yahoo.com.mx', null, 'Autopista México-Querétaro', '226', null, 'Casa Blanca', '76030', 'Querétaro', 'Querétaro', null, '1112'),
  ('Grupo Vega Díaz Querétaro', 'grupo-vega-diaz-queretaro', null, 'María Carolina Vega Diaz', '4422500742', 'factura@grupovegadiaz.com', null, 'Salvador Jimenez', '37', null, 'Reforma Agraria', '76086', 'Querétaro', 'Querétaro', 'Giro por definir con el cliente.', '1036LG'),
  ('Herrería Vidrio y Aluminio', 'herreria-vidrio-y-aluminio', 'Vidrio y aluminio', 'Jaime Cabello', '4424666931', 'jestrella7604@gmail.com', null, 'Gustavo Cardemia', '213', null, 'Reforma Agraria', '76086', 'Querétaro', 'Querétaro', null, '1043LG'),
  ('HICA Operaciones', 'hica-operaciones', 'Servicios operativos', 'Aylin Santillán', '7775675299', 'facturacion@hicamx.mx', null, 'Roberto Barrios', '1', null, 'Casa Blanca', '76030', 'Querétaro', 'Querétaro', null, '1033LG'),
  ('Hotel Crown Victoria', 'hotel-crown-victoria', 'Hotelería', 'Alejandra Vertiz Ledesma', '4172470189', 'compras@hotelcrownvictoria.com', null, 'Autopista México-Querétaro', '2100', null, 'Lomas de Casa Blanca', '76080', 'Querétaro', 'Querétaro', null, '1140LG'),
  ('MYPSA Ingeniería Industrial', 'mypsa-ingenieria-industrial', 'Ingeniería industrial', 'Lupita Rivera', '4427927772', 'oficinamypsa@gmail.com', null, 'La Ollaga', 'S/N', null, null, '76087', 'Querétaro', 'Querétaro', 'Sin colonia ni número exterior en origen.', '1046LG'),
  ('Refaccionaria Cleto', 'refaccionaria-cleto', 'Refaccionaria automotriz', 'Luis David López García', '4426104399', 'refaccionariacleto@gmail.com', null, 'José María Lozano', '26', null, 'Reforma Agraria', '76086', 'Querétaro', 'Querétaro', null, '1045DA'),
  ('Servicio Camarillo', 'servicio-camarillo', 'Taller automotriz', 'Angel Camarillo Núñez', '4424794459', 'camarillos.taller@gmail.com', null, 'Naranjon', '27', null, 'Valle Diamante', '76903', 'Corregidora', 'Querétaro', 'Duplicado 1104T fusionado. Giro por confirmar.', '1104DA'),
  ('Stop Cars', 'stop-cars', 'Taller automotriz', 'Roberto Salvador Pacheco Silverio', '4421276682', 'roberthpach.911@gmail.com', null, 'Jesús Urrueta', '100', null, 'Reforma Agraria', '76086', 'Querétaro', 'Querétaro', null, '1047DA'),
  ('Taller Automotriz Gudiños', 'taller-automotriz-gudinos', 'Taller automotriz', 'Juan Gabriel Gudiño García', '4421855561', 'juangabriel1288@gmail.com', null, 'Eriberton Allera', '81', null, 'Casa Blanca', null, 'Querétaro', 'Querétaro', 'Sin CP en origen.', '1002DA'),
  ('Taller El Gallo', 'taller-el-gallo', 'Taller automotriz', 'Abdon Morales de Luis', '4422003777', 'elgalloautomotriz@gmail.com', null, 'Antonio Carranza', '21', null, 'Reforma Agraria 5ta Sección', '76086', 'Querétaro', 'Querétaro', null, '1118DA'),
  ('Taller Herrería Estrella', 'taller-herreria-estrella', 'Herrería', 'Agustin Estrella Cabello', '4426387125', 'jestrella7604@hotmail.com', null, 'Calle 15', '907', null, 'Lomas de Casa Blanca', '76089', 'Querétaro', 'Querétaro', 'S/N = sin número exterior.', '1027LG'),
  ('Tecnica Innovacion', 'tecnica-innovacion', 'Servicios técnicos / industrial', null, '4421331592', 'tecnicainno@hotmail.com', null, 'Ponciano Herrera', '744', null, 'Los Candiles', '76903', 'Corregidora', 'Querétaro', null, null),
  ('Transmisiones Automáticas Charly', 'transmisiones-automaticas-charly', 'Taller automotriz – transmisiones', 'Carlos Alberto Franco Llamas', '4424340123', 'charlycf33@hotmail.com', null, 'Perez Alcocer', '389', null, 'Los Candiles', '76030', 'Querétaro', 'Querétaro', 'Colonia "Candile" corregida a "Los Candiles"; revisar.', '1039LG'),
  ('Vazcos Motors', 'vazcos-motors', 'Taller automotriz', 'Nahum Jefet Camargo Oseguera', '4481201112', 'nahumcamargo18@gmail.com', null, 'Plan de Ayala', '16', null, 'Casa Blanca', '76030', 'Querétaro', 'Querétaro', null, '1004DA'),
  ('VEM Tooling México', 'vem-tooling-mexico', 'Maquinados y herramentales', null, '4424715912', 'vfsrrrrr@hotmail.com', null, 'Módulo 7, Bodegas Gama', '7', null, 'Parque Industrial El Marqués 5', '76246', 'El Marqués', 'Querétaro', 'Correo parece dudoso; confirmar. Municipio inferido por CP.', '1052LG'),
  ('Vidrio y Aluminios Mora', 'vidrio-y-aluminios-mora', 'Vidrio y aluminio', 'Francisco Javier Mora Gonzalez', '4425880445', 'vidrioyaluminiomora@hotmail.com', null, 'Antonio Carranza', '21', null, 'Reforma Agraria', '76086', 'Querétaro', 'Querétaro', null, '1041DA'),
  ('Vidrios y Aluminios García', 'vidrios-y-aluminios-garcia', 'Vidrio y aluminio', 'Pablo García García', '4425772474', 'vidrioyaluminios1489@gmail.com', null, 'Boulevard de las Américas', '101', null, 'Reforma Agraria', '76086', 'Querétaro', 'Querétaro', null, '1035DA')
) as v (
  nombre_comercial, slug, giro, contacto, telefono, correo, correo_2, calle, num_ext, num_int,
  colonia, cp, municipio, estado, notas_internas, clave_origen
)
left join public.club57_partner_giros g on lower(btrim(g.nombre)) = lower(btrim(v.giro))
where not exists (
  select 1 from public.club57_partners p
  where (v.clave_origen is not null and p.clave_origen = v.clave_origen)
     or (v.telefono is not null and p.telefono = v.telefono)
     or (v.correo is not null and p.correo = v.correo)
)
on conflict do nothing;

commit;
