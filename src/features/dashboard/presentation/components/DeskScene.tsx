export default function DeskScene() {
  return <group>
    <group>
      <mesh position={[0,1.015,.4]} castShadow receiveShadow><boxGeometry args={[1.8,.05,.72]}/><meshStandardMaterial color="#183751" roughness={.65}/></mesh>
      <mesh position={[0,1.025,.035]}><boxGeometry args={[1.78,.008,.006]}/><meshStandardMaterial color="#7adfff" emissive="#2689b3" emissiveIntensity={.55}/></mesh>
      {[-.77,.77].flatMap(x=>[.12,.68].map(z=><mesh key={`${x}-${z}`} position={[x,.49,z]} castShadow><boxGeometry args={[.045,.98,.045]}/><meshStandardMaterial color="#24435c" metalness={.65} roughness={.4}/></mesh>))}
    </group>
    <group>
      <mesh position={[0,.69,-.16]} castShadow><boxGeometry args={[.57,.07,.53]}/><meshStandardMaterial color="#284b6c" roughness={.9}/></mesh>
      <mesh position={[0,1.03,-.405]} castShadow><boxGeometry args={[.55,.62,.055]}/><meshStandardMaterial color="#284b6c" roughness={.9}/></mesh>
      {[-.22,.22].flatMap(x=>[-.36,.04].map(z=><mesh key={`${x}-${z}`} position={[x,.33,z]} castShadow><boxGeometry args={[.035,.66,.035]}/><meshStandardMaterial color="#294b62" metalness={.4} roughness={.5}/></mesh>))}
    </group>
    <group>
      <mesh position={[0,1.057,.37]} castShadow><boxGeometry args={[.59,.022,.34]}/><meshStandardMaterial color="#647c92" metalness={.75} roughness={.35}/></mesh>
      <mesh position={[0,1.071,.34]}><boxGeometry args={[.48,.004,.17]}/><meshStandardMaterial color="#102336" roughness={.7}/></mesh>
      {[0,1,2,3].map(row=><mesh key={row} position={[0,1.075,.282+row*.038]}><boxGeometry args={[.45,.003,.006]}/><meshStandardMaterial color="#63839b" roughness={.65}/></mesh>)}
      <mesh position={[0,1.072,.235]}><boxGeometry args={[.15,.003,.065]}/><meshStandardMaterial color="#91a5b6" metalness={.5} roughness={.45}/></mesh>
      <group position={[0,1.067,.54]} rotation={[.2,0,0]}>
        <mesh position={[0,.185,0]} castShadow><boxGeometry args={[.59,.37,.022]}/><meshStandardMaterial color="#243e56" metalness={.65} roughness={.35}/></mesh>
        <mesh position={[0,.185,-.013]} rotation={[0,Math.PI,0]}><planeGeometry args={[.54,.32]}/><meshStandardMaterial color="#164668" emissive="#2474a4" emissiveIntensity={.55}/></mesh>
        {[0,1,2,3].map(row=><mesh key={row} position={[-.04,.28-row*.045,-.015]}><boxGeometry args={[row===0?.36:.27,.008,.002]}/><meshStandardMaterial color="#7edcff" emissive="#7edcff" emissiveIntensity={.3}/></mesh>)}
      </group>
    </group>
  </group>
}
