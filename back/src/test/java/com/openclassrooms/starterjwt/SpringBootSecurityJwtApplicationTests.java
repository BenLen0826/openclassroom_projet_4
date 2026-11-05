package com.openclassrooms.starterjwt;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Test "fumée" : vérifie seulement que l'application Spring démarre avec la configuration de test
 * (base H2, clé JWT de test). Si ce test échoue, tous les tests d'intégration échoueront aussi.
 */
// @SpringBootTest démarre le contexte Spring complet (beans, sécurité, JPA, base H2).
@SpringBootTest
class SpringBootSecurityJwtApplicationTests {

    @Test
    @DisplayName("Le contexte Spring démarre sans erreur")
    void contextLoads() {
        // Aucun code : si le contexte ne démarre pas, JUnit marque le test en échec avant même d'arriver ici.
    }
}
