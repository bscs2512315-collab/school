"use client";

// Open, powder-coated metal rack. Thin rails and corner posts keep the tubes
// visible, unlike the previous solid black end panels and thick top frame.
export function TestTubeStand({ tubeXs }: { tubeXs: number[] }) {
  const width = 0.82;
  const left = -width / 2 + 0.018;
  const right = width / 2 - 0.018;
  const metal = <meshStandardMaterial color="#252a2c" metalness={0.52} roughness={0.43} />;
  const edge = <meshStandardMaterial color="#3b4143" metalness={0.58} roughness={0.38} />;

  return (
    <group position={[0.05, 1.08, 0.4]}>
      {/* Shallow lower tray and raised lip hold the rounded tube bases. */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.016, 0.17]} />{metal}
      </mesh>
      {[-0.078, 0.078].map((z) => (
        <mesh key={`tray-${z}`} position={[0, 0.012, z]} castShadow>
          <boxGeometry args={[width, 0.015, 0.008]} />{edge}
        </mesh>
      ))}

      {/* Four slim corner posts and two open rails, not solid side walls. */}
      {[left, right].flatMap((x) => [-0.071, 0.071].map((z) => (
        <mesh key={`post-${x}-${z}`} position={[x, 0.113, z]} castShadow>
          <cylinderGeometry args={[0.007, 0.007, 0.22, 8]} />{metal}
        </mesh>
      )))}
      {[-0.071, 0.071].map((z) => (
        <mesh key={`rail-${z}`} position={[0, 0.222, z]} castShadow>
          <boxGeometry args={[width, 0.013, 0.014]} />{edge}
        </mesh>
      ))}

      {tubeXs.map((absoluteX, i) => {
        const x = absoluteX - 0.05;
        return (
          <group key={i}>
            <mesh position={[x, 0.222, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.043, 0.005, 8, 24]} />{metal}
            </mesh>
            {[-0.055, 0.055].map((z) => (
              <mesh key={z} position={[x, 0.222, z]}>
                <boxGeometry args={[0.013, 0.01, 0.027]} />{edge}
              </mesh>
            ))}
            <mesh position={[x, 0.013, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.032, 0.004, 6, 18]} />{edge}
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
