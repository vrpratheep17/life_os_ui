import Duvet from './Duvet'

export default function BedScene() {
  return <group>
    <mesh position={[0,.39,0]} castShadow receiveShadow><boxGeometry args={[1.28,.16,2.8]}/><meshStandardMaterial color="#203c56" roughness={.75}/></mesh>
    <mesh position={[0,.55,0]} castShadow receiveShadow><boxGeometry args={[1.2,.16,2.7]}/><meshStandardMaterial color="#d4e4ee" roughness={1}/></mesh>
    <mesh position={[0,.69,-1.42]} castShadow><boxGeometry args={[1.32,.9,.07]}/><meshStandardMaterial color="#315574" roughness={.85}/></mesh>
    {[-.51,.51].flatMap(x=>[-1.22,1.22].map(z=><mesh key={`${x}-${z}`} position={[x,.155,z]} castShadow><boxGeometry args={[.055,.31,.055]}/><meshStandardMaterial color="#29465f" metalness={.25} roughness={.6}/></mesh>))}
    <mesh position={[0,.66,-1.04]} scale={[.44,.045,.29]} castShadow><sphereGeometry args={[1,32,20]}/><meshStandardMaterial color="#edf4fb" roughness={1}/></mesh>
    <Duvet />
    <mesh position={[0,.401,1.406]}><boxGeometry args={[1.24,.008,.006]}/><meshStandardMaterial color="#76d9ff" emissive="#276f9f" emissiveIntensity={.4}/></mesh>
  </group>
}
