package cl.agora.moderacion;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/** Punto de entrada del microservicio ms-moderacion. */
@SpringBootApplication
public class ModeracionApplication {

    public static void main(String[] args) {
        SpringApplication.run(ModeracionApplication.class, args);
    }
}
